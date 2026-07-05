import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/stripe-config'
import { getStripe } from '@/lib/stripe-billing'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json(
      { error: 'Nemáte aktivní předplatné ke správě.' },
      { status: 404 }
    )
  }

  const stripe = getStripe()
  const appUrl = getAppUrl()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings/predplatne`,
  })

  return NextResponse.json({ url: session.url })
}
