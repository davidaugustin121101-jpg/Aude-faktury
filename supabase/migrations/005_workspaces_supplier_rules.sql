-- Workspaces (multi-client / účetní režim), paměť dodavatelů, duplicity

CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_accountant BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS active_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

ALTER TABLE processed_invoices
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES processed_invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE accounting_connections
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE TABLE supplier_accounting_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  dodavatel_ico TEXT,
  dodavatel_nazev TEXT NOT NULL,
  ucetni_kod TEXT NOT NULL,
  ucetni_kod_nazev TEXT,
  times_used INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, dodavatel_ico)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace ON processed_invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_supplier_rules_workspace ON supplier_accounting_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_duplicate_lookup
  ON processed_invoices(workspace_id, dodavatel_ico, cislo_faktury)
  WHERE status IN ('pending_review', 'sent', 'approved');

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_accounting_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vlastní workspaces" ON workspaces
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Pravidla dodavatelů ve workspace" ON supplier_accounting_rules
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Backfill: každému uživateli vytvoř workspace a propoj existující data
DO $$
DECLARE
  u RECORD;
  ws_id UUID;
BEGIN
  FOR u IN SELECT id, email, full_name FROM user_profiles LOOP
    INSERT INTO workspaces (owner_id, name)
    VALUES (u.id, COALESCE(u.full_name, split_part(u.email, '@', 1)))
    RETURNING id INTO ws_id;

    UPDATE user_profiles SET active_workspace_id = ws_id WHERE id = u.id;

    UPDATE processed_invoices SET workspace_id = ws_id
    WHERE user_id = u.id AND workspace_id IS NULL;

    UPDATE accounting_connections SET workspace_id = ws_id
    WHERE user_id = u.id AND workspace_id IS NULL;
  END LOOP;
END $$;
