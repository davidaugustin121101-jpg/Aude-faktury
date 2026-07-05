import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_MULTI_CLIENT_PLAN, getStripePriceId, isStripeCheckoutConfigured } from '@/lib/stripe-config'

/** Diagnostika Stripe konfigurace — pouze pro přihlášené uživatele */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  const hasSecret = !!process.env.STRIPE_SECRET_KEY
  const hasWebhook = !!process.env.STRIPE_WEBHOOK_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL

  return NextResponse.json({
    ok: isStripeCheckoutConfigured(),
    hasSecretKey: hasSecret,
    prices: {
      starter: !!getStripePriceId('starter'),
      pro: !!getStripePriceId('pro'),
      multi_client: !!getStripePriceId('multi_client'),
    },
    hasWebhookSecret: hasWebhook,
    appUrl: appUrl ?? null,
    secretKeyMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
      ? 'live'
      : process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
        ? 'test'
        : 'unknown',
  })
}
