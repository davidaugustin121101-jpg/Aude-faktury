-- Production hardening: RLS delete, dedup per workspace, atomic billing, indexes

-- ---------------------------------------------------------------------------
-- Dedup cleanup: keep newest invoice per workspace+supplier+number
-- ---------------------------------------------------------------------------
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, workspace_id, dodavatel_ico, cislo_faktury
      ORDER BY created_at DESC
    ) AS rn
  FROM public.processed_invoices
  WHERE status != 'rejected'
    AND workspace_id IS NOT NULL
    AND dodavatel_ico IS NOT NULL
    AND cislo_faktury IS NOT NULL
)
UPDATE public.processed_invoices pi
SET status = 'rejected'
FROM ranked r
WHERE pi.id = r.id AND r.rn > 1;

-- ---------------------------------------------------------------------------
-- RLS: allow users to delete own invoices
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users delete own invoices" ON public.processed_invoices;
CREATE POLICY "Users delete own invoices"
  ON public.processed_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Audit log: allow 'deleted' action
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoice_audit_log
  DROP CONSTRAINT IF EXISTS invoice_audit_log_action_check;

ALTER TABLE public.invoice_audit_log
  ADD CONSTRAINT invoice_audit_log_action_check
  CHECK (action IN (
    'received', 'extracted', 'approved', 'sent', 'rejected',
    'error', 'auto_approved', 'deleted'
  ));

-- ---------------------------------------------------------------------------
-- Dedup: scope to workspace (accountant multi-client)
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_invoice_dedup;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_dedup_workspace
  ON public.processed_invoices(user_id, workspace_id, dodavatel_ico, cislo_faktury)
  WHERE status != 'rejected'
    AND workspace_id IS NOT NULL
    AND dodavatel_ico IS NOT NULL
    AND cislo_faktury IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Query performance indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_processed_invoices_user_workspace_created
  ON public.processed_invoices(user_id, workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_accounting_connections_user_workspace_active
  ON public.accounting_connections(user_id, workspace_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON public.user_profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Country confirmation + free-tier extraction reservation counter
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS country_confirmed_at timestamptz;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS extraction_slots_reserved integer NOT NULL DEFAULT 0;

UPDATE public.user_profiles
SET country_confirmed_at = COALESCE(updated_at, created_at, now())
WHERE country_confirmed_at IS NULL
  AND country IS NOT NULL;

-- Sync country from auth metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_country text;
BEGIN
  v_country := COALESCE(new.raw_user_meta_data->>'country', 'cz');
  INSERT INTO public.user_profiles (id, plan, country, country_confirmed_at)
  VALUES (
    new.id,
    'free',
    v_country,
    CASE WHEN new.raw_user_meta_data->>'country' IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic invoice allowance reservation (before AI extract)
-- Returns: { ok, source?, message? } where source = pro | credit | free_monthly
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_invoice_allowance(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
  v_monthly_count integer;
  v_first_of_month timestamptz;
  v_solo_limit constant integer := 10;
BEGIN
  SELECT * INTO v_profile FROM public.user_profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Profil nenalezen');
  END IF;

  IF v_profile.stripe_subscription_id IS NOT NULL AND v_profile.plan = 'pro' THEN
    RETURN jsonb_build_object('ok', true, 'source', 'pro');
  END IF;

  IF COALESCE(v_profile.invoice_credits, 0) > 0 THEN
    UPDATE public.user_profiles
    SET invoice_credits = invoice_credits - 1
    WHERE id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'source', 'credit');
  END IF;

  v_first_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');
  SELECT count(*)::integer INTO v_monthly_count
  FROM public.processed_invoices
  WHERE user_id = p_user_id
    AND created_at >= v_first_of_month;

  IF v_monthly_count + COALESCE(v_profile.extraction_slots_reserved, 0) >= v_solo_limit THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message',
      'Limit vyčerpán. Solo tarif: 10 faktur/měsíc zdarma. Dokupte balíček Standard.'
    );
  END IF;

  UPDATE public.user_profiles
  SET extraction_slots_reserved = extraction_slots_reserved + 1
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'source', 'free_monthly');
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_invoice_allowance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_invoice_allowance(uuid) TO service_role;

-- Release reservation on failed extract (credit refund or free slot)
CREATE OR REPLACE FUNCTION public.release_invoice_reservation(
  p_user_id uuid,
  p_source text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_source = 'credit' THEN
    UPDATE public.user_profiles
    SET invoice_credits = invoice_credits + 1
    WHERE id = p_user_id;
  ELSIF p_source = 'free_monthly' THEN
    UPDATE public.user_profiles
    SET extraction_slots_reserved = GREATEST(0, extraction_slots_reserved - 1)
    WHERE id = p_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.release_invoice_reservation(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_invoice_reservation(uuid, text) TO service_role;

-- After successful free-tier insert, release reserved slot (invoice now counted)
CREATE OR REPLACE FUNCTION public.confirm_free_invoice_reservation(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET extraction_slots_reserved = GREATEST(0, extraction_slots_reserved - 1)
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_free_invoice_reservation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_free_invoice_reservation(uuid) TO service_role;

-- Atomic credit increment (Stripe webhooks)
CREATE OR REPLACE FUNCTION public.add_invoice_credits(
  p_user_id uuid,
  p_amount integer,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RETURN;
  END IF;
  UPDATE public.user_profiles
  SET
    invoice_credits = COALESCE(invoice_credits, 0) + p_amount,
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id)
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_invoice_credits(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_invoice_credits(uuid, integer, text) TO service_role;
