-- Účetní audit faktury (wow efekt MVP)
ALTER TABLE public.processed_invoices
  ADD COLUMN IF NOT EXISTS audit_result jsonb,
  ADD COLUMN IF NOT EXISTS audit_score smallint;

-- Paměť dodavatelů — účetní kód per IČO
CREATE TABLE IF NOT EXISTS public.supplier_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ico text NOT NULL,
  dodavatel_nazev text,
  default_ucetni_kod text NOT NULL,
  default_ucetni_kod_nazev text,
  note text,
  use_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id, ico)
);

CREATE INDEX IF NOT EXISTS idx_supplier_rules_lookup
  ON public.supplier_rules(user_id, workspace_id, ico);

ALTER TABLE public.supplier_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own supplier rules" ON public.supplier_rules;
CREATE POLICY "Users manage own supplier rules" ON public.supplier_rules
  FOR ALL USING (auth.uid() = user_id);
