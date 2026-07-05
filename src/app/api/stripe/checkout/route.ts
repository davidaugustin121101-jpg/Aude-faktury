import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getAppUrl,
  getStripePriceId,
  isMultiClientPlan,
  isOneTimeCheckoutPlan,
  isValidStripePlan,
  STRIPE_MULTI_CLIENT_PLAN,
  type StripePlanId,
} from '@/lib/stripe-config'
import {
  hasActiveMultiClientModule,
  hasActiveProSubscription,
  hasPaidAccess,
} from '@/lib/account-mode'
import { getStripe } from '@/lib/stripe-billing'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { plan } = body as { plan?: string }
    if (!plan || !isValidStripePlan(plan)) {
      return NextResponse.json(
        { error: 'Neplatný plán. Povolené: starter, pro, multi_client.' },
        { status: 400 }
      )
    }

    const checkoutPlan = plan as StripePlanId
    const priceId = isMultiClientPlan(checkoutPlan)
      ? getStripePriceId(STRIPE_MULTI_CLIENT_PLAN)
      : getStripePriceId(checkoutPlan as 'starter' | 'pro')

    if (!priceId) {
      const envKey = isMultiClientPlan(checkoutPlan)
        ? 'STRIPE_PRICE_MULTI_CLIENT'
        : checkoutPlan === 'starter'
          ? 'STRIPE_PRICE_STARTER'
          : 'STRIPE_PRICE_PRO'
      return NextResponse.json(
        { error: `Chybí ${envKey} na serveru (Vercel env).` },
        { status: 503 }
      )
    }

    if (priceId.startsWith('prod_')) {
      return NextResponse.json(
        {
          error:
            'Env obsahuje Product ID (prod_…). Potřebujete Price ID (price_…).',
        },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Chybí STRIPE_SECRET_KEY na serveru (Vercel env).' },
        { status: 503 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select(
        'plan, invoice_credits, stripe_customer_id, stripe_subscription_id, stripe_addon_subscription_id, is_accountant'
      )
      .eq('id', user.id)
      .maybeSingle()

    if (isMultiClientPlan(checkoutPlan)) {
      if (!hasPaidAccess(profile)) {
        return NextResponse.json(
          {
            error:
              'Modul více klientů vyžaduje kredity Standard nebo tarif Pro. Nejprve dokupte balíček 100 faktur nebo Pro.',
          },
          { status: 400 }
        )
      }
      if (hasActiveMultiClientModule(profile)) {
        return NextResponse.json(
          { error: 'Modul více klientů už máte aktivní. Spravujte v Stripe portálu.' },
          { status: 409 }
        )
      }
    } else if (
      checkoutPlan === 'pro' &&
      profile?.stripe_subscription_id &&
      hasActiveProSubscription(profile)
    ) {
      return NextResponse.json(
        { error: 'Tarif Pro už máte aktivní. Změnu proveďte ve Stripe portálu.' },
        { status: 409 }
      )
    }

    const stripe = getStripe()
    let customerId = profile?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      const admin = createAdminClient()
      const { error: saveError } = await admin
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
      if (saveError) {
        console.error('[stripe checkout] profile save failed:', saveError.message)
      }
    }

    const appUrl = getAppUrl()
    const isOneTime = isOneTimeCheckoutPlan(checkoutPlan)
    const successSuffix = isMultiClientPlan(checkoutPlan)
      ? 'addon=1'
      : isOneTime
        ? 'credits=1'
        : 'upgraded=1'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isOneTime ? 'payment' : 'subscription',
      locale: 'cs',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/predplatne?${successSuffix}`,
      cancel_url: `${appUrl}/settings/predplatne?cancelled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: { supabase_user_id: user.id, plan: checkoutPlan },
      ...(isOneTime
        ? {}
        : {
            subscription_data: {
              metadata: { supabase_user_id: user.id, plan: checkoutPlan },
            },
          }),
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe nevrátil platební URL' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe checkout]', err)

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe: ${err.message}` },
        { status: 502 }
      )
    }

    const message = err instanceof Error ? err.message : 'Neznámá chyba'
    return NextResponse.json({ error: `Checkout selhal: ${message}` }, { status: 500 })
  }
}
