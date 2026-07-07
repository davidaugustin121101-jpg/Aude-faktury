import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildInboundEmailAddress } from '@/lib/inbound-email'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('inbound_email_token')
    .eq('id', user.id)
    .maybeSingle()

  const token = (profile as { inbound_email_token?: string } | null)?.inbound_email_token
  if (!token) {
    return NextResponse.json({ error: 'Příjmová adresa není k dispozici' }, { status: 404 })
  }

  return NextResponse.json({
    address: buildInboundEmailAddress(token),
    token,
  })
}
