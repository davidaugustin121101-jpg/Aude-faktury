import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { autoApproveBelow, notifyOnNew, notifyEmail } = await req.json()

  await supabase.from('invoice_settings').upsert({
    user_id: user.id,
    auto_approve_below: autoApproveBelow ?? null,
    notify_on_new: notifyOnNew ?? true,
    notify_email: notifyEmail ?? null,
  })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ settings: data })
}
