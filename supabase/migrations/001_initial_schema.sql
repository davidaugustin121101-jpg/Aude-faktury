-- ============================================================
-- Audeflow AI – Initial Schema
-- ============================================================

-- Companies (tenants) -----------------------------------------
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  plan        text not null default 'start' check (plan in ('start','business','enterprise')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- User profiles (linked 1-to-1 with auth.users) ---------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete set null,
  full_name   text,
  role        text not null default 'member' check (role in ('owner','admin','member')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Pricelist files (metadata) ----------------------------------
create table if not exists public.pricelist_files (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  uploaded_by   uuid not null references public.profiles(id),
  file_name     text not null,
  storage_path  text not null,
  file_type     text not null check (file_type in ('excel','csv','pdf')),
  row_count     integer,
  status        text not null default 'processing' check (status in ('processing','ready','error')),
  error_message text,
  created_at    timestamptz not null default now()
);

-- Product catalogue (parsed rows from pricelist) --------------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  pricelist_id  uuid references public.pricelist_files(id) on delete set null,
  code          text not null,
  name          text not null,
  unit          text,
  price         numeric(12,4),
  currency      text not null default 'CZK',
  stock_qty     numeric(12,2),
  extra_data    jsonb,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(code,'') || ' ' || coalesce(name,''))
  ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(company_id, code)
);

-- Company rules / knowledge base (PDFs + text blocks) ---------
create table if not exists public.company_rules (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  title         text not null,
  content       text,
  storage_path  text,
  rule_type     text not null default 'general' check (rule_type in ('general','discount','shipping','other')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Quote sessions (AI-generated quotes per email interaction) --
create table if not exists public.quote_sessions (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  created_by      uuid not null references public.profiles(id),
  email_subject   text,
  email_body      text,
  raw_ai_response jsonb,
  status          text not null default 'draft' check (status in ('draft','sent','accepted','rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Quote line items -------------------------------------------
create table if not exists public.quote_items (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.quote_sessions(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  product_code     text not null,
  product_name     text not null,
  unit             text,
  quantity         numeric(12,2) not null default 1,
  unit_price       numeric(12,4) not null,
  discount_pct     numeric(5,2) default 0,
  total_price      numeric(12,4) generated always as (
    round(quantity * unit_price * (1 - coalesce(discount_pct,0)/100), 4)
  ) stored,
  validation_flag  text check (validation_flag in ('ok','unmatched','price_override')),
  sort_order       integer not null default 0
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_products_company   on public.products(company_id);
create index if not exists idx_products_search    on public.products using gin(search_vector);
create index if not exists idx_products_code      on public.products(company_id, lower(code));
create index if not exists idx_quote_sessions_co  on public.quote_sessions(company_id, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.companies        enable row level security;
alter table public.profiles         enable row level security;
alter table public.pricelist_files  enable row level security;
alter table public.products         enable row level security;
alter table public.company_rules    enable row level security;
alter table public.quote_sessions   enable row level security;
alter table public.quote_items      enable row level security;

-- Helper: company of current user
create or replace function public.my_company_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- Policies: profiles
create policy "Users see own profile"
  on public.profiles for select using (id = auth.uid());
create policy "Users update own profile"
  on public.profiles for update using (id = auth.uid());
create policy "Insert own profile on signup"
  on public.profiles for insert with check (id = auth.uid());

-- Policies: companies
create policy "Company members can view their company"
  on public.companies for select using (id = my_company_id());
create policy "Owners can update company"
  on public.companies for update using (
    id = my_company_id() and
    (select role from public.profiles where id = auth.uid()) in ('owner','admin')
  );
create policy "Allow company creation during onboarding"
  on public.companies for insert with check (true);

-- Policies: pricelist_files
create policy "Company members view pricelists"
  on public.pricelist_files for select using (company_id = my_company_id());
create policy "Members can upload pricelists"
  on public.pricelist_files for insert with check (company_id = my_company_id());
create policy "Admins can delete pricelists"
  on public.pricelist_files for delete using (
    company_id = my_company_id() and
    (select role from public.profiles where id = auth.uid()) in ('owner','admin')
  );

-- Policies: products
create policy "Company members view products"
  on public.products for select using (company_id = my_company_id());
create policy "Members can upsert products"
  on public.products for insert with check (company_id = my_company_id());
create policy "Members can update products"
  on public.products for update using (company_id = my_company_id());
create policy "Admins can delete products"
  on public.products for delete using (
    company_id = my_company_id() and
    (select role from public.profiles where id = auth.uid()) in ('owner','admin')
  );

-- Policies: company_rules
create policy "Company members view rules"
  on public.company_rules for select using (company_id = my_company_id());
create policy "Admins manage rules"
  on public.company_rules for all using (
    company_id = my_company_id() and
    (select role from public.profiles where id = auth.uid()) in ('owner','admin')
  );

-- Policies: quote_sessions
create policy "Company members view sessions"
  on public.quote_sessions for select using (company_id = my_company_id());
create policy "Members create sessions"
  on public.quote_sessions for insert with check (company_id = my_company_id());
create policy "Members update own sessions"
  on public.quote_sessions for update using (
    company_id = my_company_id() and created_by = auth.uid()
  );

-- Policies: quote_items (access via session)
create policy "View items via session access"
  on public.quote_items for select using (
    exists (
      select 1 from public.quote_sessions s
      where s.id = quote_items.session_id and s.company_id = my_company_id()
    )
  );
create policy "Insert items via session access"
  on public.quote_items for insert with check (
    exists (
      select 1 from public.quote_sessions s
      where s.id = quote_items.session_id and s.company_id = my_company_id()
    )
  );
create policy "Update items via session access"
  on public.quote_items for update using (
    exists (
      select 1 from public.quote_sessions s
      where s.id = quote_items.session_id and s.company_id = my_company_id()
    )
  );
create policy "Delete items via session access"
  on public.quote_items for delete using (
    exists (
      select 1 from public.quote_sessions s
      where s.id = quote_items.session_id and s.company_id = my_company_id()
    )
  );

-- ============================================================
-- Trigger: updated_at auto-update
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger trg_quote_sessions_updated_at
  before update on public.quote_sessions
  for each row execute function public.set_updated_at();

-- ============================================================
-- Storage buckets (run via Supabase dashboard or CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('pricelists', 'pricelists', false);
-- insert into storage.buckets (id, name, public) values ('company-docs', 'company-docs', false);
