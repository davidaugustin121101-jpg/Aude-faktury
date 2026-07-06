import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('user_profiles')
      .update({ country: 'cz', country_confirmed_at: new Date().toISOString() })
      .eq('id', user.id)
  } else {
    await supabase.from('user_profiles').insert({
      id: user.id,
      email: user.email ?? '',
      plan: 'free',
      country: 'cz',
      country_confirmed_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ ok: true, country: 'cz' })
}

export async function GET() {
  return NextResponse.json({ country: 'cz' })
}
