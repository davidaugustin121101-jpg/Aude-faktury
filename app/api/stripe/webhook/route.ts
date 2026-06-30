import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: ReturnType<ReturnType<typeof getStripe>['webhooks']['constructEvent']>
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Neplatný podpis' }, { status: 400 })
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'customer.subscription.updated'
  ) {
    const session = event.data.object as {
      metadata?: { user_id?: string; plan?: string }
      subscription?: string
      id?: string
    }
    const userId = session.metadata?.user_id
    const plan = session.metadata?.plan
    if (userId && plan) {
      await supabaseAdmin
        .from('user_profiles')
        .update({
          plan,
          stripe_subscription_id: session.subscription ?? session.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as { id: string }
    await supabaseAdmin
      .from('user_profiles')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
