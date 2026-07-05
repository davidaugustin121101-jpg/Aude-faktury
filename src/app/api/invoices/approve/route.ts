import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { INVOICE_ACTIONABLE_STATUSES, type ProcessedInvoice } from '@/types/invoices'
import { sendInvoiceToAccounting } from '@/lib/send-invoice'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invoiceId, rememberSupplier = false, forceSend = false } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'Chybí invoiceId' }, { status: 400 })

  const { data: invoice } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 })

  const inv = invoice as ProcessedInvoice

  if (!INVOICE_ACTIONABLE_STATUSES.includes(inv.status)) {
    return NextResponse.json({ error: 'Faktura již byla zpracována' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

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
