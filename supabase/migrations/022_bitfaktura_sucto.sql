-- BitFaktura + Súčto accounting providers

ALTER TABLE public.accounting_connections
  ADD COLUMN IF NOT EXISTS bitfaktura_domain text,
  ADD COLUMN IF NOT EXISTS bitfaktura_api_token_id text,
  ADD COLUMN IF NOT EXISTS sucto_email text,
  ADD COLUMN IF NOT EXISTS sucto_password_id text,
  ADD COLUMN IF NOT EXISTS sucto_company_id text;

ALTER TABLE public.accounting_connections
  DROP CONSTRAINT IF EXISTS accounting_connections_provider_check;

ALTER TABLE public.accounting_connections
  ADD CONSTRAINT accounting_connections_provider_check
    CHECK (provider IN ('idoklad', 'fakturoid', 'superfaktura', 'bitfaktura', 'sucto'));
