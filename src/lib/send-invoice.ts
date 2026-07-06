import type { SupabaseClient } from '@supabase/supabase-js'
import { sendToIdoklad, type IdokladConnection } from '@/lib/idoklad'
import { sendToFakturoid } from '@/lib/fakturoid'
import { sendToSuperFaktura } from '@/lib/superfaktura'
import { getConnectionForInvoiceWithSecrets } from '@/lib/accounting-connection'
import { buildPredkontaceFromExtracted } from '@/lib/predkontace'
import { loadInvoicePdfAttachment } from '@/lib/invoice-pdf-storage'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExtractedInvoiceData } from '@/lib/claude'
import type { ProcessedInvoice } from '@/types/invoices'
import { upsertSupplierRule } from '@/lib/supplier-rules'
import type { AuditResult } from '@/lib/invoice-audit/types'
import { insertAuditLog } from '@/lib/audit-log'
import { INVOICE_SEND_CLAIM_STATUSES } from '@/lib/invoice-guards'
import type { CountryCode } from '@/lib/accounting-codes'

type AccountingRow = Record<string, unknown> & {
  id: string
  provider: string
  country?: 'cz' | 'sk'
  idoklad_client_id?: string | null
  idoklad_client_secret?: string | null
  fakturoid_oauth_token?: string | null
  fakturoid_account_slug?: string | null
  fakturoid_client_id?: string | null
  fakturoid_client_secret?: string | null
  fakturoid_token_expires_at?: string | null
  superfaktura_api_email?: string | null
  superfaktura_api_key?: string | null
  superfaktura_company_id?: string | null
}

export function buildExtractedDataFromInvoice(inv: ProcessedInvoice): ExtractedInvoiceData {
  const raw = (inv.raw_extraction ?? {}) as Record<string, unknown>

  return {
    dodavatel_nazev: inv.dodavatel_nazev ?? '',
    dodavatel_ico: inv.dodavatel_ico ?? '',
    dodavatel_dic: inv.dodavatel_dic,
    cislo_faktury: inv.cislo_faktury ?? '',
    datum_vystaveni: inv.datum_vystaveni ?? new Date().toISOString().slice(0, 10),
    datum_splatnosti: inv.datum_splatnosti ?? new Date().toISOString().slice(0, 10),
    variabilni_symbol: inv.variabilni_symbol ?? '',
    castka_bez_dph: Number(inv.castka_bez_dph ?? 0),
    sazba_dph: inv.sazba_dph ?? 21,
    castka_dph: Number(inv.castka_dph ?? 0),
    castka_celkem: Number(inv.castka_celkem ?? 0),
    mena: inv.mena ?? 'CZK',
    popis_plneni: inv.popis_plneni ?? '',
    iban: inv.iban,
    ucetni_kod: inv.ucetni_kod ?? '518',
    ucetni_kod_nazev: inv.ucetni_kod_nazev ?? 'Ostatní služby',
    ucetni_kod_duvod: inv.ucetni_kod_duvod ?? '',
    ucetni_kod_confidence: inv.ucetni_kod_confidence ?? 0,
    confidence: inv.confidence ?? 0,
    problemy: inv.problemy ?? [],
    typ_dokladu: (raw.typ_dokladu as ExtractedInvoiceData['typ_dokladu']) ?? 'faktura',
    je_prenesena_dan: Boolean(raw.je_prenesena_dan),
  }
}

export async function sendInvoiceToAccounting(params: {
  supabase: SupabaseClient
  userId: string
  userEmail: string
  fullName?: string | null
  invoice: ProcessedInvoice
  rememberSupplier?: boolean
  forceSend?: boolean
  auditAction?: 'sent' | 'auto_approved'
}): Promise<{ ok: true; documentId: string } | { ok: false; error: string; status: number }> {
  const {
    supabase,
    userId,
    userEmail,
    fullName,
    invoice,
    rememberSupplier = false,
    forceSend = false,
    auditAction = 'sent',
  } = params

  if (invoice.status === 'sent_to_accounting' && invoice.accounting_document_id) {
    return { ok: true, documentId: invoice.accounting_document_id }
  }

  const audit = invoice.audit_result as AuditResult | null
  if (audit?.hasCritical && !forceSend) {
    return {
      ok: false,
      error:
        'Faktura má kritické chyby v auditu. Opravte je nebo potvrďte odeslání navzdory varování.',
      status: 400,
    }
  }

  const accounting = await getConnectionForInvoiceWithSecrets(
    userId,
    userEmail,
    fullName,
    invoice.workspace_id
  )

  if (!accounting) {
    return { ok: false, error: 'Žádný fakturační systém není připojen', status: 400 }
  }

  const conn = accounting as AccountingRow
  const extractedData = buildExtractedDataFromInvoice(invoice)

  const { data: claimed, error: claimError } = await supabase
    .from('processed_invoices')
    .update({ status: 'approved' })
    .eq('id', invoice.id)
    .eq('user_id', userId)
    .in('status', [...INVOICE_SEND_CLAIM_STATUSES])
    .select('id')
    .maybeSingle()

  if (claimError) {
    return { ok: false, error: claimError.message, status: 500 }
  }

  if (!claimed) {
    const { data: current } = await supabase
      .from('processed_invoices')
      .select('status, accounting_document_id')
      .eq('id', invoice.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (current?.status === 'sent_to_accounting' && current.accounting_document_id) {
      return { ok: true, documentId: String(current.accounting_document_id) }
    }

    return {
      ok: false,
      error: 'Faktura již byla odeslána nebo se právě zpracovává.',
      status: 409,
    }
  }

  try {
    let result: { id: string; documentNumber?: string; number?: string; pdfAttached?: boolean; pdfAttachmentError?: string }
    let pdfAttached = false
    let pdfAttachmentError: string | undefined

    const pdf = await loadInvoicePdfAttachment(
      createAdminClient(),
      invoice.storage_path,
      invoice.original_filename
    ).catch(() => null)

    if (conn.provider === 'idoklad') {
      const idokladConn: IdokladConnection = {
        provider: 'idoklad',
        client_id: conn.idoklad_client_id ?? null,
        client_secret: conn.idoklad_client_secret ?? '',
      }
      const r = await sendToIdoklad(idokladConn, extractedData, pdf, {
        country: (conn.country as CountryCode | undefined) ?? 'cz',
      })
      result = { id: r.id, documentNumber: r.documentNumber, pdfAttached: r.pdfAttached }
      pdfAttached = r.pdfAttached
      pdfAttachmentError = r.pdfAttachmentError
    } else if (conn.provider === 'superfaktura') {
      const r = await sendToSuperFaktura(
        {
          email: conn.superfaktura_api_email ?? '',
          apiKey: conn.superfaktura_api_key ?? '',
          companyId: conn.superfaktura_company_id ?? '',
          country: conn.country ?? 'cz',
        },
        extractedData,
        pdf
      )
      result = { id: r.id, number: r.number, pdfAttached: r.pdfAttached }
      pdfAttached = r.pdfAttached
    } else {
      const r = await sendToFakturoid(
        {
          fakturoid_oauth_token: conn.fakturoid_oauth_token,
          fakturoid_account_slug: conn.fakturoid_account_slug,
          fakturoid_client_id: conn.fakturoid_client_id,
          fakturoid_client_secret: conn.fakturoid_client_secret,
          fakturoid_token_expires_at: conn.fakturoid_token_expires_at as string | null,
        },
        extractedData
      )
      result = { id: r.id, number: r.number }
    }

    const documentId = result.documentNumber ?? result.number ?? result.id
    const { error: updateError } = await supabase
      .from('processed_invoices')
      .update({
        status: 'sent_to_accounting',
        accounting_provider: conn.provider,
        accounting_document_id: documentId,
        accounting_connection_id: conn.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)
      .eq('user_id', userId)
      .eq('status', 'approved')

    if (updateError) {
      throw new Error(`Faktura odeslána (${documentId}), ale stav se nepodařilo uložit: ${updateError.message}`)
    }

    if (rememberSupplier && invoice.dodavatel_ico && invoice.ucetni_kod) {
      await upsertSupplierRule(supabase, {
        userId,
        workspaceId: invoice.workspace_id,
        ico: invoice.dodavatel_ico,
        dodavatelNazev: invoice.dodavatel_nazev,
        ucetniKod: invoice.ucetni_kod,
        ucetniKodNazev: invoice.ucetni_kod_nazev,
      })
    }

    await insertAuditLog({
      invoice_id: invoice.id,
      user_id: userId,
      action: auditAction,
      details: {
        provider: conn.provider,
        document_id: result.id,
        ucetni_kod: extractedData.ucetni_kod,
        predkontace: buildPredkontaceFromExtracted(extractedData)?.display ?? null,
        pdf_attached: pdfAttached,
        pdf_available: !!pdf,
        ...(pdfAttachmentError ? { pdf_attachment_error: pdfAttachmentError } : {}),
        forced: forceSend && !!audit?.hasCritical,
      },
    })

    return { ok: true, documentId: result.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Neznámá chyba'

    await supabase
      .from('processed_invoices')
      .update({ status: 'error' })
      .eq('id', invoice.id)
      .eq('user_id', userId)
      .eq('status', 'approved')

    await insertAuditLog({
      invoice_id: invoice.id,
      user_id: userId,
      action: 'error',
      details: { error: message, provider: conn.provider },
    })

    return { ok: false, error: message, status: 500 }
  }
}
