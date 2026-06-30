-- OAuth token refresh pro Fakturoid + název připojeného účtu
ALTER TABLE accounting_connections
  ADD COLUMN IF NOT EXISTS fakturoid_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS fakturoid_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS connection_label TEXT;
