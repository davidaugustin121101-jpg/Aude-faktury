-- Security hardening: billing fields, credential column access, legacy status fix

-- 1. Block self-service updates to billing / entitlement fields
CREATE OR REPLACE FUNCTION public.protect_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan
      OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
      OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
      OR NEW.stripe_addon_subscription_id IS DISTINCT FROM OLD.stripe_addon_subscription_id
      OR NEW.invoice_credits IS DISTINCT FROM OLD.invoice_credits
      OR NEW.is_accountant IS DISTINCT FROM OLD.is_accountant
    THEN
      RAISE EXCEPTION 'billing_fields_readonly'
        USING HINT = 'Billing fields can only be updated by the system.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_billing_fields ON public.user_profiles;
CREATE TRIGGER trg_protect_billing_fields
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_billing_fields();

-- 2. Hide secret columns from authenticated role (service_role retains full access)
REVOKE ALL ON public.accounting_connections FROM authenticated;

GRANT SELECT (
  id,
  user_id,
  workspace_id,
  provider,
  country,
  is_active,
  created_at,
  idoklad_client_id,
  fakturoid_account_slug,
  superfaktura_company_id,
  superfaktura_api_email
) ON public.accounting_connections TO authenticated;

-- 3. Normalize legacy invoice status
UPDATE public.processed_invoices
SET status = 'sent_to_accounting'
WHERE status = 'sent';
