-- ============================================================
-- Audeflow AI – Invoice Module Schema
-- ============================================================

-- Email connections ----------------------------------------
create table if not exists public.email_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      text not null check (provider in ('gmail', 'outlook', 'imap')),
  email_address text not null,
  -- Tokens stored as Supabase Vault secret IDs (not plain text)
  access_token_secret_id  text,
  refresh_token_secret_id text,
  token_expiry  timestamptz,
  imap_host     text,
  imap_port     integer default 993,
  -- For IMAP: password secret ID
  imap_password_secret_id text,
  is_active     boolean not null default true,
  last_checked_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Accounting system connections ----------------------------
create table if not exists public.accounting_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      text not null check (provider in ('idoklad', 'fakturoid')),
  -- API key/token stored as Vault secret ID
  api_key_secret_id  text,
  account_slug  text,   -- Fakturoid account slug
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- User invoice settings ------------------------------------
create table if not exists public.invoice_settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  auto_approve_below   numeric(12,2),  -- NULL = never auto-approve
  notify_on_new        boolean not null default true,
  notify_email         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Processed invoices ---------------------------------------
create table if not exists public.processed_invoices (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  email_connection_id   uuid references public.email_connections(id) on delete set null,
  -- Extracted data
  dodavatel_nazev       text,
  dodavatel_ico         text,
  dodavatel_dic         text,
  cislo_faktury         text,
  datum_vystaveni       date,
  datum_splatnosti      date,
  variabilni_symbol     text,
  castka_bez_dph        numeric(12,2),
  sazba_dph             integer,
  castka_dph            numeric(12,2),
  castka_celkem         numeric(12,2),
  mena                  text not null default 'CZK',
  popis_plneni          text,
  iban                  text,
  -- AI confidence metadata
  confidence            numeric(3,2),
  problemy              text[],
  raw_extraction        jsonb,
  -- Processing status
  status                text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'sent_to_accounting', 'error', 'needs_manual_check')),
  -- Accounting integration
  accounting_provider   text,
  accounting_document_id text,
  accounting_connection_id uuid references public.accounting_connections(id) on delete set null,
  -- Source email metadata
  original_email_id     text,
  sender_email          text,
  received_at           timestamptz,
  -- Timestamps
  created_at            timestamptz not null default now(),
  processed_at          timestamptz,
  updated_at            timestamptz not null default now()
);

-- Audit log ------------------------------------------------
create table if not exists public.invoice_audit_log (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid references public.processed_invoices(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null
    check (action in ('received', 'extracted', 'approved', 'sent', 'rejected', 'error', 'auto_approved')),
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_email_connections_user
  on public.email_connections(user_id);
create index if not exists idx_accounting_connections_user
  on public.accounting_connections(user_id);
create index if not exists idx_processed_invoices_user
  on public.processed_invoices(user_id, created_at desc);
create index if not exists idx_processed_invoices_status
  on public.processed_invoices(user_id, status);
create index if not exists idx_invoice_audit_invoice
  on public.invoice_audit_log(invoice_id, created_at desc);

-- Duplicate invoice check: same supplier + invoice number per user
create unique index if not exists idx_invoice_dedup
  on public.processed_invoices(user_id, dodavatel_ico, cislo_faktury)
  where status != 'rejected';

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.email_connections       enable row level security;
alter table public.accounting_connections  enable row level security;
alter table public.invoice_settings        enable row level security;
alter table public.processed_invoices      enable row level security;
alter table public.invoice_audit_log       enable row level security;

-- email_connections
create policy "Users manage own email connections"
  on public.email_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- accounting_connections
create policy "Users manage own accounting connections"
  on public.accounting_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- invoice_settings
create policy "Users manage own invoice settings"
  on public.invoice_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- processed_invoices
create policy "Users see own invoices"
  on public.processed_invoices for select
  using (auth.uid() = user_id);
create policy "Users insert own invoices"
  on public.processed_invoices for insert
  with check (auth.uid() = user_id);
create policy "Users update own invoices"
  on public.processed_invoices for update
  using (auth.uid() = user_id);

-- invoice_audit_log: read-only for users; service role writes
create policy "Users view own audit log"
  on public.invoice_audit_log for select
  using (auth.uid() = user_id);

-- ============================================================
-- updated_at triggers
-- ============================================================
create trigger trg_email_connections_updated_at
  before update on public.email_connections
  for each row execute function public.set_updated_at();

create trigger trg_accounting_connections_updated_at
  before update on public.accounting_connections
  for each row execute function public.set_updated_at();

create trigger trg_invoice_settings_updated_at
  before update on public.invoice_settings
  for each row execute function public.set_updated_at();

create trigger trg_processed_invoices_updated_at
  before update on public.processed_invoices
  for each row execute function public.set_updated_at();
