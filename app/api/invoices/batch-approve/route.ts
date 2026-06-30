import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendToIdoklad } from '@/lib/idoklad'
import { sendToFakturoid } from '@/lib/fakturoid'
import { saveSupplierRule } from '@/lib/supplier-rules'
import { getActiveWorkspace } from '@/lib/workspace'
import { getWorkspaceConnection } from '@/lib/accounting-connection'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const { invoiceIds } = (await req.json()) as { invoiceIds?: string[] }
  if (!invoiceIds?.length) {
    return NextResponse.json({ error: 'Žádné faktury k odeslání' }, { status: 400 })
  }
  if (invoiceIds.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 faktur najednou' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  const activeConn = await getWorkspaceConnection(supabase, user.id, workspace.id)

  if (!activeConn) {
    return NextResponse.json(
      {
        error: `Klient „${workspace.name}" nemá připojený fakturační systém. Připoj iDoklad nebo Fakturoid v Nastavení → Fakturační systém.`,
        workspaceName: workspace.name,
        needsConnection: true,
      },
      { status: 400 }
    )
  }

  const results: Array<{ invoiceId: string; ok: boolean; error?: string; documentId?: string }> =
    []

  for (const invoiceId of invoiceIds) {
    const { data: invoice } = await supabase
      .from('processed_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .eq('workspace_id', workspace.id)
      .eq('status', 'pending_review')
      .maybeSingle()

    if (!invoice) {
      results.push({ invoiceId, ok: false, error: 'Faktura nenalezena nebo už odeslána' })
      continue
    }

    try {
      let pdfBuffer: Buffer | null = null
      if (invoice.pdf_storage_path) {
        const { data: pdfBlob } = await supabase.storage
          .from('invoice-pdfs')
          .download(invoice.pdf_storage_path)
        if (pdfBlob) pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
      }

      let documentId: string
      let documentUrl: string

      if (activeConn.provider === 'idoklad') {
        const result = await sendToIdoklad(
          activeConn as Parameters<typeof sendToIdoklad>[0],
          invoice
        )
        documentId = result.id
        documentUrl = result.url
      } else if (activeConn.provider === 'fakturoid') {
        const result = await sendToFakturoid(
          activeConn,
          invoice,
          async (tokens) => {
            await supabase.from('accounting_connections').update(tokens).eq('id', activeConn.id)
          },
          pdfBuffer
        )
        documentId = result.id
        documentUrl = result.url
      } else {
        results.push({ invoiceId, ok: false, error: 'Neznámý provider' })
        continue
      }

      await supabase
        .from('processed_invoices')
        .update({
          status: 'sent',
          accounting_provider: activeConn.provider,
          accounting_document_id: documentId,
          accounting_document_url: documentUrl,
          processed_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)

      await supabase.rpc('increment_invoice_count', { p_user_id: user.id })

      if (invoice.ucetni_kod) {
        await saveSupplierRule(
          supabase,
          workspace.id,
          invoice.dodavatel_ico,
          invoice.dodavatel_nazev,
          invoice.ucetni_kod,
          invoice.ucetni_kod_nazev
        )
      }

      await supabase.from('invoice_audit_log').insert({
        invoice_id: invoiceId,
        user_id: user.id,
        action: 'sent',
        details: { provider: activeConn.provider, document_id: documentId, batch: true },
      })

      results.push({ invoiceId, ok: true, documentId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Neznámá chyba'
      await supabase
        .from('processed_invoices')
        .update({ status: 'error', error_message: message })
        .eq('id', invoiceId)
      results.push({ invoiceId, ok: false, error: message })
    }
  }

  const succeeded = results.filter((r) => r.ok).length
  return NextResponse.json({ total: invoiceIds.length, succeeded, results })
}
