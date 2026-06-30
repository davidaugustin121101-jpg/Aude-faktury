import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendToIdoklad } from '@/lib/idoklad'
import { sendToFakturoid } from '@/lib/fakturoid'
import { sendInvoiceSentEmail } from '@/lib/resend'
import { saveSupplierRule } from '@/lib/supplier-rules'
import { getActiveWorkspace } from '@/lib/workspace'
import { getWorkspaceConnection } from '@/lib/accounting-connection'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const { invoiceId, updatedData, forceDuplicate } = await req.json()

  const { data: invoice } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 })

  if (invoice.is_duplicate && !forceDuplicate) {
    return NextResponse.json(
      {
        error: 'Tato faktura vypadá jako duplicita. Potvrď odeslání nebo ji zahod.',
        duplicate: true,
      },
      { status: 409 }
    )
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )
  const workspaceId = invoice.workspace_id ?? workspace.id

  const { data: invoiceWorkspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single()

  const clientName = invoiceWorkspace?.name ?? workspace.name

  const activeConn = await getWorkspaceConnection(supabase, user.id, workspaceId)

  if (!activeConn) {
    return NextResponse.json(
      {
        error: `Klient „${clientName}" nemá připojený fakturační systém. Jdi do Nastavení → Fakturační systém a připoj iDoklad nebo Fakturoid pro tohoto klienta.`,
        workspaceName: clientName,
        needsConnection: true,
      },
      { status: 400 }
    )
  }

  const finalData = { ...invoice, ...updatedData }
  let documentId: string
  let documentUrl: string
  let fakturoidMode: 'expense' | 'inbox' | undefined

  try {
    let pdfBuffer: Buffer | null = null
    if (invoice.pdf_storage_path) {
      const { data: pdfBlob, error: downloadError } = await supabase.storage
        .from('invoice-pdfs')
        .download(invoice.pdf_storage_path)
      if (!downloadError && pdfBlob) {
        pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
      }
    }

    if (activeConn.provider === 'idoklad') {
      const result = await sendToIdoklad(
        activeConn as Parameters<typeof sendToIdoklad>[0],
        finalData
      )
      documentId = result.id
      documentUrl = result.url
    } else if (activeConn.provider === 'fakturoid') {
      const result = await sendToFakturoid(
        activeConn,
        finalData,
        async (tokens) => {
          await supabase.from('accounting_connections').update(tokens).eq('id', activeConn.id)
        },
        pdfBuffer
      )
      documentId = result.id
      documentUrl = result.url
      fakturoidMode = result.mode
      if (result.mode === 'inbox') {
        await supabase.from('invoice_audit_log').insert({
          invoice_id: invoiceId,
          user_id: user.id,
          action: 'sent_inbox_fallback',
          details: { reason: 'fakturoid_plan_limit', document_id: documentId },
        })
      }
    } else {
      return NextResponse.json({ error: 'Neznámý fakturační systém' }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Neznámá chyba'
    await supabase
      .from('processed_invoices')
      .update({ status: 'error', error_message: message })
      .eq('id', invoiceId)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  await supabase
    .from('processed_invoices')
    .update({
      status: 'sent',
      accounting_provider: activeConn.provider,
      accounting_document_id: documentId,
      accounting_document_url: documentUrl,
      processed_at: new Date().toISOString(),
      ...updatedData,
    })
    .eq('id', invoiceId)

  await supabase.rpc('increment_invoice_count', { p_user_id: user.id })

  if (finalData.ucetni_kod) {
    await saveSupplierRule(
      supabase,
      workspaceId,
      finalData.dodavatel_ico,
      finalData.dodavatel_nazev,
      finalData.ucetni_kod,
      finalData.ucetni_kod_nazev
    )
  }

  await supabase.from('invoice_audit_log').insert({
    invoice_id: invoiceId,
    user_id: user.id,
    action: 'sent',
    details: { provider: activeConn.provider, document_id: documentId },
  })

  if (profile?.email) {
    await sendInvoiceSentEmail(
      profile.email,
      finalData.cislo_faktury ?? 'bez čísla',
      documentUrl
    )
  }

  return NextResponse.json({
    success: true,
    documentId,
    documentUrl,
    fakturoidMode: activeConn.provider === 'fakturoid' ? fakturoidMode : undefined,
  })
}
