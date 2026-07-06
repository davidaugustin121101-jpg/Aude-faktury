import type { BillingTier } from '@/lib/account-mode'

type CheckoutPlan = 'starter' | 'pro' | 'multi_client'

function subscriptionPath(plan?: CheckoutPlan): string {
  return plan ? `/settings/predplatne?checkout=${plan}` : '/settings/predplatne'
}

function authAwareHref(path: string, isAuthenticated: boolean): string {
  if (isAuthenticated) return path
  return `/login?next=${encodeURIComponent(path)}`
}

export function getLandingTierHref(tier: BillingTier, isAuthenticated: boolean): string {
  if (tier.id === 'free') {
    return isAuthenticated ? '/faktury/upload' : '/register'
  }
  return authAwareHref(subscriptionPath(tier.checkoutPlan), isAuthenticated)
}

export function getMultiClientAddonHref(isAuthenticated: boolean): string {
  return authAwareHref(subscriptionPath('multi_client'), isAuthenticated)
}

export function getLandingPrimaryCtaHref(isAuthenticated: boolean): string {
  return isAuthenticated ? '/faktury/upload' : '/register'
}
