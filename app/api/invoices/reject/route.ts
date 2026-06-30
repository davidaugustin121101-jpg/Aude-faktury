import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const { invoiceId } = await req.json()

  await supabase
    .from('processed_invoices')
    .update({ status: 'rejected' })
    .eq('id', invoiceId)
    .eq('user_id', user.id)

  await supabase.from('invoice_audit_log').insert({
    invoice_id: invoiceId,
    user_id: user.id,
    action: 'rejected',
    details: {},
  })

  return NextResponse.json({ success: true })
}
