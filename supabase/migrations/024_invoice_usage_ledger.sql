-- Neměnná evidence spotřeby limitu faktur (smazání faktury nesmí vrátit kredit / měsíční slot)

CREATE TABLE IF NOT EXISTS public.invoice_usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  allowance_source text NOT NULL CHECK (allowance_source IN ('pro', 'credit', 'free_monthly')),
  invoice_id uuid REFERENCES public.processed_invoices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_usage_ledger_user_created
  ON public.invoice_usage_ledger(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoice_usage_ledger_user_month_free
  ON public.invoice_usage_ledger(user_id, created_at)
  WHERE allowance_source = 'free_monthly';

ALTER TABLE public.invoice_usage_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own invoice usage" ON public.invoice_usage_ledger;
CREATE POLICY "Users read own invoice usage"
  ON public.invoice_usage_ledger FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE public.processed_invoices
  ADD COLUMN IF NOT EXISTS allowance_source text
  CHECK (allowance_source IS NULL OR allowance_source IN ('pro', 'credit', 'free_monthly'));

-- Backfill ledger pro faktury z běžícího měsíce (aby už spotřebované sloty zůstaly započtené)
INSERT INTO public.invoice_usage_ledger (user_id, workspace_id, allowance_source, invoice_id, created_at)
SELECT
  pi.user_id,
  pi.workspace_id,
  CASE
    WHEN up.stripe_subscription_id IS NOT NULL AND up.plan = 'pro' THEN 'pro'
    ELSE 'free_monthly'
  END,
  pi.id,
  pi.created_at
FROM public.processed_invoices pi
JOIN public.user_profiles up ON up.id = pi.user_id
WHERE pi.created_at >= date_trunc('month', now() AT TIME ZONE 'UTC')
  AND NOT EXISTS (
    SELECT 1 FROM public.invoice_usage_ledger l WHERE l.invoice_id = pi.id
  );

-- ---------------------------------------------------------------------------
-- reserve: kredit jen ověří, stržení až po úspěšném vytěžení (confirm)
-- free_monthly: počítá z ledgeru, ne z živých řádků processed_invoices
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
    RETURN jsonb_build_object('ok', true, 'source', 'credit');
  END IF;

  v_first_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');
  SELECT count(*)::integer INTO v_monthly_count
  FROM public.invoice_usage_ledger
  WHERE user_id = p_user_id
    AND allowance_source = 'free_monthly'
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

-- Uvolnění jen rezervace probíhající extrakce (selhání před uložením faktury)
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
  IF p_source = 'free_monthly' THEN
    UPDATE public.user_profiles
    SET extraction_slots_reserved = GREATEST(0, extraction_slots_reserved - 1)
    WHERE id = p_user_id;
  END IF;
  -- credit: při selhání před confirm se kredit nestrhává, není co vracet
END;
$$;

-- Po úspěšném uložení faktury: trvale započítat spotřebu (smazání faktury ji nevrací)
CREATE OR REPLACE FUNCTION public.confirm_invoice_usage(
  p_user_id uuid,
  p_workspace_id uuid,
  p_source text,
  p_invoice_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_source = 'credit' THEN
    UPDATE public.user_profiles
    SET invoice_credits = invoice_credits - 1
    WHERE id = p_user_id
      AND invoice_credits > 0;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_invoice_credits';
    END IF;
  ELSIF p_source = 'free_monthly' THEN
    UPDATE public.user_profiles
    SET extraction_slots_reserved = GREATEST(0, extraction_slots_reserved - 1)
    WHERE id = p_user_id;
  END IF;

  INSERT INTO public.invoice_usage_ledger (user_id, workspace_id, allowance_source, invoice_id)
  VALUES (p_user_id, p_workspace_id, p_source, p_invoice_id);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_invoice_usage(uuid, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_invoice_usage(uuid, uuid, text, uuid) TO service_role;

-- Nahrazuje confirm_free_invoice_reservation (zachováno pro kompatibilitu, deleguje na confirm)
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
