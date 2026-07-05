/** Veřejná URL aplikace (Vercel / produkce) */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}

/** Základní tarify (objem faktur) */
export const STRIPE_BASE_PLANS = {
  starter: 'starter',
  pro: 'pro',
} as const

export type StripeBasePlanId = (typeof STRIPE_BASE_PLANS)[keyof typeof STRIPE_BASE_PLANS]

/** Doplňkový modul — více klientů (299 Kč/měsíc navíc k Standard nebo Pro) */
export const STRIPE_MULTI_CLIENT_PLAN = 'multi_client' as const

/** Všechny plány pro checkout */
export const STRIPE_PLANS = {
  ...STRIPE_BASE_PLANS,
  multi_client: STRIPE_MULTI_CLIENT_PLAN,
} as const

export type StripePlanId = (typeof STRIPE_PLANS)[keyof typeof STRIPE_PLANS]

/** @deprecated */
export const STRIPE_ACCOUNTANT_PLAN = STRIPE_MULTI_CLIENT_PLAN

export function isMultiClientPlan(plan: string): boolean {
  return plan === 'multi_client' || plan === 'accountant'
}

export function isOneTimeCheckoutPlan(plan: string): boolean {
  return plan === 'starter'
}

export function isSubscriptionCheckoutPlan(plan: string): boolean {
  return plan === 'pro' || isMultiClientPlan(plan)
}

export function isBasePlan(plan: string): plan is StripeBasePlanId {
  return plan === 'starter' || plan === 'pro'
}

export function isValidStripePlan(plan: string): plan is StripePlanId {
  return isBasePlan(plan) || isMultiClientPlan(plan)
}

export function getStripePriceId(
  plan: StripeBasePlanId | typeof STRIPE_MULTI_CLIENT_PLAN
): string | undefined {
  if (plan === 'starter') return process.env.STRIPE_PRICE_STARTER
  if (plan === 'pro') return process.env.STRIPE_PRICE_PRO
  return process.env.STRIPE_PRICE_MULTI_CLIENT ?? process.env.STRIPE_PRICE_ACCOUNTANT
}

/** @deprecated */
export function getStripeAccountantPriceId(): string | undefined {
  return getStripePriceId(STRIPE_MULTI_CLIENT_PLAN)
}

export function isStripeCheckoutConfigured(): boolean {
  if (!process.env.STRIPE_SECRET_KEY) return false
  return (
    !!getStripePriceId('starter') ||
    !!getStripePriceId('pro') ||
    !!getStripePriceId(STRIPE_MULTI_CLIENT_PLAN)
  )
}

export function isStripeWebhookConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)
}
