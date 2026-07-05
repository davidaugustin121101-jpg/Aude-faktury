-- Workspaces (multi-client / účetní režim)

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_accountant BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS active_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

ALTER TABLE processed_invoices
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE accounting_connections
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace ON processed_invoices(workspace_id);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vlastní workspaces" ON workspaces;
CREATE POLICY "Vlastní workspaces" ON workspaces
  FOR ALL USING (auth.uid() = owner_id);
