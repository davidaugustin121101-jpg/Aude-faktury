-- ============================================================
-- Audeflow AI – Accounting code fields + iDoklad OAuth2 support
-- ============================================================

-- Add accounting code columns to processed_invoices
ALTER TABLE public.processed_invoices
  ADD COLUMN IF NOT EXISTS ucetni_kod           text,
  ADD COLUMN IF NOT EXISTS ucetni_kod_nazev     text,
  ADD COLUMN IF NOT EXISTS ucetni_kod_duvod     text,
  ADD COLUMN IF NOT EXISTS ucetni_kod_confidence numeric(3,2),
  ADD COLUMN IF NOT EXISTS original_filename    text;

-- Add iDoklad OAuth2 fields to accounting_connections
-- client_id: plain text (not secret)
-- client_secret_id: Vault secret ID for the client_secret
ALTER TABLE public.accounting_connections
  ADD COLUMN IF NOT EXISTS client_id         text,
  ADD COLUMN IF NOT EXISTS client_secret_id  text;
