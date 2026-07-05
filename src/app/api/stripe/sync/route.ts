import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncUserSubscriptionFromStripe } from '@/lib/stripe-billing'

/** Po checkoutu stáhne stav předplatného ze Stripe a aktivuje účetní režim */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const result = await syncUserSubscriptionFromStripe(admin, user.id, user.email)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync selhal'
    console.error('[stripe sync]', message)
    return NextResponse.json({ error: message, activated: false }, { status: 500 })
  }
}
