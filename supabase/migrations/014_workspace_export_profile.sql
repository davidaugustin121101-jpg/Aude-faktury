-- Workspace export profile (Pohoda / Money / Helios)

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS export_company_ico text,
  ADD COLUMN IF NOT EXISTS export_default_account_code text,
  ADD COLUMN IF NOT EXISTS export_cost_center text,
  ADD COLUMN IF NOT EXISTS export_contract_code text,
  ADD COLUMN IF NOT EXISTS export_money_document_type text DEFAULT 'FP',
  ADD COLUMN IF NOT EXISTS export_helios_variant text DEFAULT 'red'
    CHECK (export_helios_variant IN ('red', 'inuvio')),
  ADD COLUMN IF NOT EXISTS export_country text DEFAULT 'cz'
    CHECK (export_country IN ('cz', 'sk'));
