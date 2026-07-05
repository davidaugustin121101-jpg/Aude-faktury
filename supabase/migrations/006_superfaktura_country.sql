-- SuperFaktura + country CZ/SK (production Aude-faktury schema)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'cz'
    CHECK (country IN ('cz', 'sk'));

ALTER TABLE public.accounting_connections
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'cz'
    CHECK (country IN ('cz', 'sk'));

ALTER TABLE public.accounting_connections
  ADD COLUMN IF NOT EXISTS superfaktura_api_email text,
  ADD COLUMN IF NOT EXISTS superfaktura_api_key text,
  ADD COLUMN IF NOT EXISTS superfaktura_company_id text;

ALTER TABLE public.accounting_connections
  DROP CONSTRAINT IF EXISTS accounting_connections_provider_check;

ALTER TABLE public.accounting_connections
  ADD CONSTRAINT accounting_connections_provider_check
    CHECK (provider IN ('idoklad', 'fakturoid', 'superfaktura'));

ALTER TABLE public.processed_invoices
  DROP CONSTRAINT IF EXISTS processed_invoices_sazba_dph_check;

ALTER TABLE public.processed_invoices
  ADD CONSTRAINT processed_invoices_sazba_dph_check
    CHECK (sazba_dph IS NULL OR sazba_dph = ANY (ARRAY[0, 10, 12, 20, 21]));
