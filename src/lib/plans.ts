/** @deprecated Používejte account-mode.ts */
export {
  INVOICE_LIMITS as PLAN_LIMITS,
  getEffectivePlan,
  getInvoiceLimit,
  hasActiveSubscription,
  type BillingPlan as PlanId,
} from '@/lib/account-mode'

export { isStripeCheckoutConfigured as isStripeConfigured } from '@/lib/stripe-config'
