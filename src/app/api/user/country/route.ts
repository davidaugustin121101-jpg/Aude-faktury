import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CountryCode } from '@/lib/accounting-codes'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { country } = (await req.json()) as { country?: CountryCode }
  if (country !== 'cz' && country !== 'sk') {
    return NextResponse.json({ error: 'Neplatná země' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('user_profiles').update({ country }).eq('id', user.id)
  } else {
    await supabase.from('user_profiles').insert({
      id: user.id,
      email: user.email ?? '',
      plan: 'free',
      country,
    })
  }

  return NextResponse.json({ ok: true, country })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('country')
    .eq('id', user.id)
    .maybeSingle()

  const country = ((profile as { country?: string } | null)?.country ?? 'cz') as CountryCode
  return NextResponse.json({ country })
}
