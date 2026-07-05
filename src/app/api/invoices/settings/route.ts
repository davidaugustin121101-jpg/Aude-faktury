import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { autoApproveBelow, notifyOnNew, notifyEmail } = await req.json()

  let parsedThreshold: number | null = null
  if (autoApproveBelow != null && autoApproveBelow !== '') {
    const num = Number(autoApproveBelow)
    if (Number.isNaN(num) || num < 0 || num > 99_999_999) {
      return NextResponse.json({ error: 'Neplatný limit pro auto-odeslání' }, { status: 400 })
    }
    parsedThreshold = num
  }

  if (notifyEmail && typeof notifyEmail === 'string' && notifyEmail.trim()) {
    const email = notifyEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Neplatný e-mail pro notifikace' }, { status: 400 })
    }
  }

  const { error } = await supabase.from('invoice_settings').upsert({
    user_id: user.id,
    auto_approve_below: parsedThreshold,
    notify_on_new: notifyOnNew ?? true,
    notify_email: notifyEmail?.trim() || null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { data } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ settings: data })
}
