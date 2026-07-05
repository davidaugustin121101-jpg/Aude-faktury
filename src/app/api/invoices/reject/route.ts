import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { insertAuditLog } from '@/lib/audit-log'
import { INVOICE_REJECTABLE_STATUSES } from '@/lib/invoice-guards'
import { getActiveWorkspace } from '@/lib/workspace'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'Chybí invoiceId' }, { status: 400 })

  const { data: existing } = await supabase
    .from('processed_invoices')
    .select('id, dodavatel_nazev, cislo_faktury, status, workspace_id')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  if (existing.workspace_id && existing.workspace_id !== workspace.id) {
    return NextResponse.json({ error: 'Faktura patří jinému klientovi.' }, { status: 403 })
  }

  if (!INVOICE_REJECTABLE_STATUSES.includes(existing.status as (typeof INVOICE_REJECTABLE_STATUSES)[number])) {
    return NextResponse.json(
      { error: 'Tuto fakturu nelze zamítnout — už byla odeslána do účetnictví.' },
      { status: 400 }
    )
  }

  const { data: updated, error } = await supabase
    .from('processed_invoices')
    .update({ status: 'rejected', processed_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .in('status', [...INVOICE_REJECTABLE_STATUSES])
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated) {
    return NextResponse.json({ error: 'Faktura již byla zpracována.' }, { status: 409 })
  }

  await insertAuditLog({
    invoice_id: invoiceId,
    user_id: user.id,
    action: 'rejected',
    details: { rejected_by: 'user' },
  })

  return NextResponse.json({ ok: true })
}
