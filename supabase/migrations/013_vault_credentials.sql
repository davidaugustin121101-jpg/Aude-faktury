-- Accounting credentials → Supabase Vault (secret IDs instead of plaintext)

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Vault secret ID columns (plaintext columns kept for backward-compat migration)
ALTER TABLE public.accounting_connections
  ADD COLUMN IF NOT EXISTS idoklad_client_secret_id text,
  ADD COLUMN IF NOT EXISTS fakturoid_oauth_token_id text,
  ADD COLUMN IF NOT EXISTS fakturoid_client_secret_id text,
  ADD COLUMN IF NOT EXISTS superfaktura_api_key_id text;

-- Store or update a vault secret; returns secret UUID as text
CREATE OR REPLACE FUNCTION public.store_vault_secret(
  p_secret text,
  p_name text,
  p_description text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_id uuid;
  v_existing uuid;
BEGIN
  IF p_secret IS NULL OR p_secret = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_existing
  FROM vault.secrets
  WHERE name = p_name
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    PERFORM vault.update_secret(v_existing, p_secret, p_name, p_description);
    RETURN v_existing::text;
  END IF;

  v_id := vault.create_secret(p_secret, p_name, p_description);
  RETURN v_id::text;
END;
$$;

REVOKE ALL ON FUNCTION public.store_vault_secret(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_vault_secret(text, text, text) TO service_role;

-- Read decrypted secret by vault secret UUID
CREATE OR REPLACE FUNCTION public.read_vault_secret(p_secret_id text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, vault
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE id = p_secret_id::uuid
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.read_vault_secret(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_vault_secret(text) TO service_role;

-- Delete vault secret when connection removed
CREATE OR REPLACE FUNCTION public.delete_vault_secret(p_secret_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  IF p_secret_id IS NULL OR p_secret_id = '' THEN
    RETURN;
  END IF;
  DELETE FROM vault.secrets WHERE id = p_secret_id::uuid;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_vault_secret(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_vault_secret(text) TO service_role;

-- Atomic credit decrement (returns new balance or -1 if insufficient)
CREATE OR REPLACE FUNCTION public.decrement_invoice_credit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits integer;
BEGIN
  UPDATE public.user_profiles
  SET invoice_credits = invoice_credits - 1
  WHERE id = p_user_id
    AND invoice_credits > 0
  RETURNING invoice_credits INTO v_credits;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN v_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_invoice_credit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_invoice_credit(uuid) TO service_role;

-- Stripe webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.stripe_webhook_events FROM authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_webhook_events (event_id, event_type)
  VALUES (p_event_id, p_event_type);
  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_stripe_webhook_event(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text) TO service_role;
