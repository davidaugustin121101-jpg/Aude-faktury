import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendToIdoklad, type IdokladConnection } from '@/lib/idoklad'
import { sendToFakturoid } from '@/lib/fakturoid'
import { sendToSuperFaktura } from '@/lib/superfaktura'
import { getConnectionForInvoiceWithSecrets } from '@/lib/accounting-connection'
import type { CountryCode } from '@/lib/accounting-codes'
import type { ExtractedInvoiceData } from '@/lib/claude'
import { INVOICE_ACTIONABLE_STATUSES, type ProcessedInvoice } from '@/types/invoices'
import { upsertSupplierRule } from '@/lib/supplier-rules'
import type { AuditResult } from '@/lib/invoice-audit/types'
import { insertAuditLog } from '@/lib/audit-log'

type AccountingRow = Record<string, unknown> & {
  id: string
  provider: string
  country?: CountryCode
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

  const audit = inv.audit_result as AuditResult | null
  if (audit?.hasCritical && !forceSend) {
    return NextResponse.json(
      { error: 'Faktura má kritické chyby v auditu. Opravte je nebo potvrďte odeslání navzdory varování.' },
      { status: 400 }
    )
  }

  if (!INVOICE_ACTIONABLE_STATUSES.includes(inv.status)) {
    return NextResponse.json({ error: 'Faktura již byla zpracována' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const accounting = await getConnectionForInvoiceWithSecrets(
    user.id,
    user.email ?? '',
    profile?.full_name,
    inv.workspace_id
  )

  if (!accounting) {
    return NextResponse.json({ error: 'Žádný fakturační systém není připojen' }, { status: 400 })
  }

  const conn = accounting as AccountingRow

  const raw = (inv.raw_extraction ?? {}) as Record<string, unknown>

  const extractedData: ExtractedInvoiceData = {
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
    typ_dokladu:
      (raw.typ_dokladu as ExtractedInvoiceData['typ_dokladu']) ?? 'faktura',
    je_prenesena_dan: Boolean(raw.je_prenesena_dan),
  }

  try {
    let result: { id: string; documentNumber?: string; number?: string }

    if (conn.provider === 'idoklad') {
      const idokladConn: IdokladConnection = {
        provider: 'idoklad',
        client_id: conn.idoklad_client_id ?? null,
        client_secret: conn.idoklad_client_secret ?? '',
      }
      const r = await sendToIdoklad(idokladConn, extractedData)
      result = { id: r.id, documentNumber: r.documentNumber }
    } else if (conn.provider === 'superfaktura') {
      const r = await sendToSuperFaktura(
        {
          email: conn.superfaktura_api_email ?? '',
          apiKey: conn.superfaktura_api_key ?? '',
          companyId: conn.superfaktura_company_id ?? '',
          country: conn.country ?? 'cz',
        },
        extractedData
      )
      result = { id: r.id, number: r.number }
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
      .eq('id', invoiceId)

    if (updateError) {
      throw new Error(`Faktura odeslána, ale stav se nepodařilo uložit: ${updateError.message}`)
    }

    if (rememberSupplier && inv.dodavatel_ico && inv.ucetni_kod) {
      await upsertSupplierRule(supabase, {
        userId: user.id,
        workspaceId: inv.workspace_id,
        ico: inv.dodavatel_ico,
        dodavatelNazev: inv.dodavatel_nazev,
        ucetniKod: inv.ucetni_kod,
        ucetniKodNazev: inv.ucetni_kod_nazev,
      })
    }

    await insertAuditLog({
      invoice_id: invoiceId,
      user_id: user.id,
      action: 'sent',
      details: {
        provider: conn.provider,
        document_id: result.id,
        ucetni_kod: extractedData.ucetni_kod,
        forced: forceSend && !!audit?.hasCritical,
      },
    })

    return NextResponse.json({ ok: true, documentId: result.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Neznámá chyba'

    await supabase
      .from('processed_invoices')
      .update({ status: 'needs_manual_check' })
      .eq('id', invoiceId)

    await insertAuditLog({
      invoice_id: invoiceId,
      user_id: user.id,
      action: 'error',
      details: { error: message, provider: conn.provider },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
