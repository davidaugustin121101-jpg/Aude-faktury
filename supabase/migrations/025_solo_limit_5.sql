-- Solo free tier: 10 → 5 faktur/měsíc
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
  v_solo_limit constant integer := 5;
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
      'Limit vyčerpán. Solo tarif: 5 faktur/měsíc zdarma. Dokupte balíček Standard.'
    );
  END IF;

  UPDATE public.user_profiles
  SET extraction_slots_reserved = extraction_slots_reserved + 1
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'source', 'free_monthly');
END;
$$;
