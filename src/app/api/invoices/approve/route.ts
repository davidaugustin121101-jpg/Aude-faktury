import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type ProcessedInvoice } from '@/types/invoices'
import { sendInvoiceToAccounting } from '@/lib/send-invoice'
import { getActiveWorkspace } from '@/lib/workspace'
import { INVOICE_SEND_CLAIM_STATUSES } from '@/lib/invoice-guards'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { invoiceId, rememberSupplier = false, forceSend = false } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'Chybí invoiceId' }, { status: 400 })

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

  const { data: invoice } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 })

  const inv = invoice as ProcessedInvoice

  if (!INVOICE_SEND_CLAIM_STATUSES.includes(inv.status as (typeof INVOICE_SEND_CLAIM_STATUSES)[number])) {
    return NextResponse.json({ error: 'Faktura již byla zpracována' }, { status: 400 })
  }

  const result = await sendInvoiceToAccounting({
    supabase,
    userId: user.id,
    userEmail: user.email ?? '',
    fullName: profile?.full_name,
    invoice: inv,
    rememberSupplier,
    forceSend,
    auditAction: 'sent',
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true, documentId: result.documentId })
}
