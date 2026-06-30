-- Fakturoid: OAuth vs. API klíče (Client Credentials z Uživatelského účtu)
ALTER TABLE accounting_connections
  ADD COLUMN IF NOT EXISTS connection_mode TEXT CHECK (connection_mode IN ('oauth', 'api_keys')),
  ADD COLUMN IF NOT EXISTS fakturoid_client_id TEXT,
  ADD COLUMN IF NOT EXISTS fakturoid_client_secret TEXT;
