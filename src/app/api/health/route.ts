import { NextResponse } from 'next/server'
import { isStripeCheckoutConfigured } from '@/lib/stripe-config'
import { getSupabaseUrl } from '@/lib/supabase/env'

/** Veřejná kontrola stavu produkce — bez citlivých dat */
export async function GET() {
  const checks = {
    app: 'faktury-audeflow',
    timestamp: new Date().toISOString(),
    supabase: !!getSupabaseUrl() && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    stripe: isStripeCheckoutConfigured(),
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    resend: !!process.env.RESEND_API_KEY,
  }

  const ok = checks.supabase && checks.anthropic

  return NextResponse.json(
    { ok, checks },
    { status: ok ? 200 : 503 }
  )
}
