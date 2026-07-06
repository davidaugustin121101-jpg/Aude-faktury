export type BillingPlan = 'free' | 'pro'
export type AccountMode = 'solo' | 'accountant'

export const SOLO_INVOICE_LIMIT = 10
export const STANDARD_PACK_CREDITS = 100
export const MULTI_CLIENT_ADDON_PRICE = '299 Kč / měsíc'

export const PLAN_LABELS: Record<BillingPlan | 'standard_pack', string> = {
  free: 'Solo',
  standard_pack: 'Standard',
  pro: 'Pro',
}

export type UserBillingProfile = {
  plan?: string | null
  invoice_credits?: number | null
  is_accountant?: boolean | null
  stripe_subscription_id?: string | null
  stripe_addon_subscription_id?: string | null
}

export type InvoiceAllowanceSource = 'pro' | 'credit' | 'free_monthly'

export function getInvoiceCredits(profile: UserBillingProfile | null | undefined): number {
  return Math.max(0, profile?.invoice_credits ?? 0)
}

/** Pro = jediné měsíční předplatné pro neomezené faktury */
export function hasActiveProSubscription(
  profile: UserBillingProfile | null | undefined
): boolean {
  return !!(profile?.stripe_subscription_id && profile?.plan === 'pro')
}

/** Má placený přístup — kredity Standard nebo Pro předplatné */
export function hasPaidAccess(profile: UserBillingProfile | null | undefined): boolean {
  return getInvoiceCredits(profile) > 0 || hasActiveProSubscription(profile)
}

export function getEffectivePlan(
  profile: UserBillingProfile | null | undefined
): BillingPlan {
  if (hasActiveProSubscription(profile)) return 'pro'
  return 'free'
}

export function hasActiveBaseSubscription(
  profile: UserBillingProfile | null | undefined
): boolean {
  return hasPaidAccess(profile)
}

/** @deprecated */
export function hasActiveSubscription(
  profile: UserBillingProfile | null | undefined
): boolean {
  return hasPaidAccess(profile)
}

export function hasActiveMultiClientModule(
  profile: UserBillingProfile | null | undefined
): boolean {
  return !!(profile?.stripe_addon_subscription_id && profile?.is_accountant)
}

export function hasActiveAccountantSubscription(
  profile: UserBillingProfile | null | undefined
): boolean {
  return hasPaidAccess(profile) && hasActiveMultiClientModule(profile)
}

export function getAccountMode(profile: UserBillingProfile | null | undefined): AccountMode {
  return hasActiveAccountantSubscription(profile) ? 'accountant' : 'solo'
}

/** Může uživatel nahrát další fakturu? */
export function resolveInvoiceAllowance(
  profile: UserBillingProfile | null | undefined,
  monthlyUsed: number
):
  | { allowed: true; source: InvoiceAllowanceSource }
  | { allowed: false; message: string } {
  if (hasActiveProSubscription(profile)) {
    return { allowed: true, source: 'pro' }
  }
  if (getInvoiceCredits(profile) > 0) {
    return { allowed: true, source: 'credit' }
  }
  if (monthlyUsed < SOLO_INVOICE_LIMIT) {
    return { allowed: true, source: 'free_monthly' }
  }
  return {
    allowed: false,
    message: `Limit vyčerpán. Solo tarif: ${SOLO_INVOICE_LIMIT} faktur/měsíc zdarma. Dokupte balíček Standard — 100 faktur za 299 Kč (kredit bez expirace).`,
  }
}

export function getInvoiceLimit(profile: UserBillingProfile | null | undefined): number {
  if (hasActiveProSubscription(profile)) return 999_999
  const credits = getInvoiceCredits(profile)
  if (credits > 0) return credits
  return SOLO_INVOICE_LIMIT
}

/** Popisek limitu pro UI — kredity nejsou měsíční */
export function getInvoiceLimitLabel(
  profile: UserBillingProfile | null | undefined
): string {
  if (hasActiveProSubscription(profile)) return 'Neomezeně / měsíc'
  const credits = getInvoiceCredits(profile)
  if (credits > 0) return `${credits} kreditů (bez expirace)`
  return `${SOLO_INVOICE_LIMIT} / měsíc`
}

export function getFreeMonthlyRemaining(monthlyUsed: number): number {
  return Math.max(0, SOLO_INVOICE_LIMIT - monthlyUsed)
}

export function getInvoicesRemaining(
  profile: UserBillingProfile | null | undefined,
  usedThisMonth: number
): number {
  if (hasActiveProSubscription(profile)) return 999_999
  const credits = getInvoiceCredits(profile)
  if (credits > 0) return credits
  return getFreeMonthlyRemaining(usedThisMonth)
}

export function getPlanLabel(profile: UserBillingProfile | null | undefined): string {
  const parts: string[] = []
  if (hasActiveProSubscription(profile)) {
    parts.push(PLAN_LABELS.pro)
  } else if (getInvoiceCredits(profile) > 0) {
    parts.push(`${PLAN_LABELS.standard_pack} (${getInvoiceCredits(profile)} kreditů)`)
  } else {
    parts.push(PLAN_LABELS.free)
  }
  if (hasActiveMultiClientModule(profile)) {
    parts.push('Více klientů')
  }
  return parts.join(' + ')
}

export const MODE_LABELS: Record<AccountMode, string> = {
  solo: 'Solo',
  accountant: 'Více klientů',
}

export const MODE_DESCRIPTIONS: Record<AccountMode, string> = {
  solo: 'Jeden účet · jeden fakturační systém',
  accountant: 'Více klientů · každý vlastní fakturační systém',
}

export type BillingTier = {
  id: 'free' | 'starter' | 'pro'
  checkoutPlan?: 'starter' | 'pro'
  name: string
  price: string
  period: string
  tagline: string
  benefits: string[]
  highlighted: boolean
}

export const BILLING_TIERS: BillingTier[] = [
  {
    id: 'free',
    name: 'Solo',
    price: '0 Kč',
    period: 'navždy',
    tagline: 'Pro podnikatele a OSVČ — jeden fakturační systém',
    benefits: [
      '1 fakturační systém (iDoklad, Fakturoid nebo SuperFaktura)',
      '10 faktur měsíčně zdarma',
      'PDF drag & drop + automatické vytěžení',
      'Návrh českého účetního kódu',
      'Kontrola před odesláním',
    ],
    highlighted: true,
  },
  {
    id: 'starter',
    checkoutPlan: 'starter',
    name: 'Standard',
    price: '299 Kč',
    period: 'jednorázově',
    tagline: '100 faktur jako kredit — využijete kdykoliv, neexpiruje',
    benefits: [
      '1 fakturační systém',
      '100 faktur (kreditový pool)',
      'Platíte jednou, ne měsíčně',
      'PDF drag & drop + automatické vytěžení',
      'Návrh českého účetního kódu',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    checkoutPlan: 'pro',
    name: 'Pro',
    price: '899 Kč',
    period: '/ měsíc',
    tagline: 'Neomezený objem faktur — měsíční předplatné',
    benefits: [
      '1 fakturační systém',
      'Neomezeně faktur měsíčně',
      'PDF drag & drop + automatické vytěžení',
      'Návrh českého účetního kódu',
      'Prioritní podpora',
    ],
    highlighted: false,
  },
]

export const MULTI_CLIENT_ADDON = {
  id: 'multi_client' as const,
  checkoutPlan: 'multi_client' as const,
  name: 'Modul více klientů',
  price: '299 Kč',
  period: '/ měsíc',
  tagline: 'Doplňek — vyžaduje kredity Standard nebo tarif Pro',
  benefits: [
    'Neomezený počet klientů',
    'Každý klient = vlastní fakturační systém',
    'Přepínání klientů jedním klikem',
    'Limit faktur = váš kredit nebo Pro tarif',
  ],
}

/** @deprecated */
export const SOLO_INVOICE_LIMIT_EXPORT = SOLO_INVOICE_LIMIT
export const STARTER_INVOICE_LIMIT = STANDARD_PACK_CREDITS
export const INVOICE_LIMITS = { free: SOLO_INVOICE_LIMIT, starter: STANDARD_PACK_CREDITS, pro: 999_999 }
export const ACCOUNTANT_PRICE = MULTI_CLIENT_ADDON_PRICE
