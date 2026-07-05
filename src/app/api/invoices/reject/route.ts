import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { insertAuditLog } from '@/lib/audit-log'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'Chybí invoiceId' }, { status: 400 })

  const { error } = await supabase
    .from('processed_invoices')
    .update({ status: 'rejected', processed_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await insertAuditLog({
    invoice_id: invoiceId,
    user_id: user.id,
    action: 'rejected',
    details: { rejected_by: 'user' },
  })

  return NextResponse.json({ ok: true })
}
