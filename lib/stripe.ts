import Stripe from 'stripe'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY není nastaven')
  return new Stripe(key, { apiVersion: '2026-06-24.dahlia' })
}

export const PLANS = {
  free: { name: 'Free', limit: 10, price: 0 },
  starter: {
    name: 'Starter',
    limit: 100,
    price: 299,
    stripePriceId: process.env.STRIPE_PRICE_STARTER!,
  },
  pro: {
    name: 'Pro',
    limit: 999999,
    price: 599,
    stripePriceId: process.env.STRIPE_PRICE_PRO!,
  },
} as const

export type PlanKey = keyof typeof PLANS
