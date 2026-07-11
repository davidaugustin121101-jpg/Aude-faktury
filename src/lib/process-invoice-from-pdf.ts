import type { SupabaseClient } from '@supabase/supabase-js'
import { extractInvoiceFromPdf, type ExtractedInvoiceData } from '@/lib/claude'
import { getDefaultCurrency } from '@/lib/accounting-codes'
import { runInvoiceAudit } from '@/lib/invoice-audit/run-audit'
import { getSupplierRule } from '@/lib/supplier-rules'
import { insertAuditLog } from '@/lib/audit-log'
import { sendNewInvoiceNotification } from '@/lib/notifications'
import { sendInvoiceToAccounting } from '@/lib/send-invoice'
import { saveInvoicePdf } from '@/lib/invoice-pdf-storage'
import { findDuplicateInvoice, formatDuplicateMessage } from '@/lib/duplicate-invoice'
import { applyPolozkyToExtraction } from '@/lib/polozky-predkontace'
import { reconcileExtractionAmounts, isZalohovaTyp } from '@/lib/invoice-amounts'
import {
  normalizeCzechVatRate,
  normalizeExtractedBankFields,
} from '@/lib/invoice-output'
import type { ProcessedInvoice } from '@/types/invoices'
import type { AuditResult } from '@/lib/invoice-audit/types'
import {
  confirmInvoiceUsage,
  releaseInvoiceReservation,
  type AllowanceSource,
} from '@/lib/invoice-allowance'


export type ProcessInvoiceSource = 'manual_upload' | 'email_inbound'

export type ProcessInvoiceInput = {
  supabase: SupabaseClient
  admin: SupabaseClient
  userId: string
  userEmail: string
  fullName?: string | null
  workspaceId: string
  pdfBuffer: Buffer
  filename: string
  source: ProcessInvoiceSource
  senderEmail?: string | null
  originalEmailId?: string | null
  receivedAt?: string | null
  allowanceSource: AllowanceSource
  invoiceSettings?: {
    auto_approve_below?: number | null
    notify_on_new?: boolean | null
    notify_email?: string | null
  } | null
}

export type ProcessInvoiceSuccess = {
  ok: true
  invoice: ProcessedInvoice
  audit: AuditResult
  autoApproved: boolean
}

export type ProcessInvoiceDuplicate = {
  ok: false
  duplicate: true
  existingInvoiceId: string
  message: string
  existingStatus: string
}

export type ProcessInvoiceError = {
  ok: false
  duplicate: false
  error: string
  status: number
}

export type ProcessInvoiceResult =
  | ProcessInvoiceSuccess
  | ProcessInvoiceDuplicate
  | ProcessInvoiceError

export async function processInvoiceFromPdf(
  input: ProcessInvoiceInput
): Promise<ProcessInvoiceResult> {
  const {
    supabase,
    admin,
    userId,
    userEmail,
    fullName,
    workspaceId,
    pdfBuffer,
    filename,
    source,
    senderEmail,
    originalEmailId,
    receivedAt,
    allowanceSource,
    invoiceSettings,
  } = input

  const base64 = pdfBuffer.toString('base64')

  let extracted: ExtractedInvoiceData
  try {
    extracted = await extractInvoiceFromPdf(base64)
  } catch (err) {
    await releaseInvoiceReservation(userId, allowanceSource)
    const message = err instanceof Error ? err.message : 'Chyba při vytěžení faktury'
    return { ok: false, duplicate: false, error: message, status: 500 }
  }

  extracted = applyPolozkyToExtraction(extracted)
  extracted = reconcileExtractionAmounts(extracted)
  extracted = normalizeExtractedBankFields(extracted)

  if (isZalohovaTyp(extracted)) {
    extracted = {
      ...extracted,
      typ_faktury: 'zalohova',
      ucetni_kod: '314',
      ucetni_kod_nazev: 'Poskytnuté zálohy',
      ucetni_kod_duvod: `Zálohová faktura — předkontace 314/315/321. ${extracted.ucetni_kod_duvod}`,
    }
  }

  const supplierRule = await getSupplierRule(supabase, userId, workspaceId, extracted.dodavatel_ico)

  if (supplierRule && !extracted.polozky?.length) {
    extracted = {
      ...extracted,
      ucetni_kod: supplierRule.default_ucetni_kod,
      ucetni_kod_nazev: supplierRule.default_ucetni_kod_nazev ?? extracted.ucetni_kod_nazev,
      ucetni_kod_duvod: `Dodavatel známý z minula (${supplierRule.use_count}× schváleno). ${extracted.ucetni_kod_duvod}`,
      ucetni_kod_confidence: Math.max(extracted.ucetni_kod_confidence, 0.92),
    }
  }

  const sazbaDph = normalizeCzechVatRate(extracted.sazba_dph)

  const duplicate = await findDuplicateInvoice(supabase, userId, workspaceId, {
    dodavatel_ico: extracted.dodavatel_ico,
    cislo_faktury: extracted.cislo_faktury,
    variabilni_symbol: extracted.variabilni_symbol,
    castka_celkem: extracted.castka_celkem,
  })

  if (duplicate) {
    await releaseInvoiceReservation(userId, allowanceSource)
    return {
      ok: false,
      duplicate: true,
      existingInvoiceId: duplicate.id,
      message: formatDuplicateMessage(duplicate),
      existingStatus: duplicate.status,
    }
  }

  const auditResult = await runInvoiceAudit(
    {
      dodavatel_nazev: extracted.dodavatel_nazev,
      dodavatel_ico: extracted.dodavatel_ico,
      dodavatel_dic: extracted.dodavatel_dic,
      cislo_faktury: extracted.cislo_faktury,
      datum_vystaveni: extracted.datum_vystaveni,
      datum_splatnosti: extracted.datum_splatnosti,
      variabilni_symbol: extracted.variabilni_symbol,
      castka_bez_dph: extracted.castka_bez_dph,
      sazba_dph: sazbaDph,
      castka_dph: extracted.castka_dph,
      castka_celkem: extracted.castka_celkem,
      ucetni_kod: extracted.ucetni_kod,
      je_prenesena_dan: extracted.je_prenesena_dan,
      typ_faktury: extracted.typ_faktury,
      typ_dokladu: extracted.typ_dokladu,
      castka_k_uhrade: extracted.castka_k_uhrade,
      polozky: extracted.polozky,
    },
    { supabase, userId, workspaceId }
  )

  const status = auditResult.hasCritical ? 'needs_manual_check' : 'pending_review'

  const { data: invoice, error: dbErr } = await supabase
    .from('processed_invoices')
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      dodavatel_nazev: extracted.dodavatel_nazev,
      dodavatel_ico: extracted.dodavatel_ico,
      dodavatel_dic: extracted.dodavatel_dic,
      cislo_faktury: extracted.cislo_faktury,
      datum_vystaveni: extracted.datum_vystaveni,
      datum_splatnosti: extracted.datum_splatnosti,
      variabilni_symbol: extracted.variabilni_symbol,
      castka_bez_dph: extracted.castka_bez_dph,
      sazba_dph: sazbaDph,
      castka_dph: extracted.castka_dph,
      castka_celkem: extracted.castka_celkem,
      mena: extracted.mena ?? getDefaultCurrency(),
      popis_plneni: extracted.popis_plneni,
      iban: extracted.iban,
      ucetni_kod: extracted.ucetni_kod,
      ucetni_kod_nazev: extracted.ucetni_kod_nazev,
      ucetni_kod_duvod: extracted.ucetni_kod_duvod,
      ucetni_kod_confidence: extracted.ucetni_kod_confidence,
      confidence: extracted.confidence,
      problemy: extracted.problemy ?? [],
      raw_extraction: extracted as unknown as Record<string, unknown>,
      original_filename: filename,
      sender_email: senderEmail ?? null,
      original_email_id: originalEmailId ?? null,
      received_at: receivedAt ?? (source === 'email_inbound' ? new Date().toISOString() : null),
      status,
      audit_result: auditResult,
      audit_score: auditResult.score,
      allowance_source: allowanceSource,
    })
    .select()
    .single()

  if (dbErr || !invoice) {
    await releaseInvoiceReservation(userId, allowanceSource)
    if (dbErr?.code === '23505') {
      return {
        ok: false,
        duplicate: true,
        existingInvoiceId: '',
        message:
          'Faktura se stejným IČO dodavatele a číslem dokladu už existuje. Otevřete existující záznam ve fakturách.',
        existingStatus: 'unknown',
      }
    }
    return {
      ok: false,
      duplicate: false,
      error: dbErr?.message ?? 'Chyba při ukládání do databáze',
      status: 500,
    }
  }

  try {
    await confirmInvoiceUsage({
      userId,
      workspaceId,
      source: allowanceSource,
      invoiceId: invoice.id,
    })
  } catch (usageErr) {
    console.error('[process-invoice] allowance confirm failed, rolling back invoice:', usageErr)
    await supabase.from('processed_invoices').delete().eq('id', invoice.id).eq('user_id', userId)
    await releaseInvoiceReservation(userId, allowanceSource)
    return {
      ok: false,
      duplicate: false,
      error: 'Nepodařilo se započítat spotřebu faktury. Zkuste to znovu.',
      status: 500,
    }
  }

  let finalInvoice = invoice as ProcessedInvoice
  try {
    const storagePath = await saveInvoicePdf(admin, userId, invoice.id, pdfBuffer)
    const { data: withPdf, error: pdfUpdateErr } = await supabase
      .from('processed_invoices')
      .update({ storage_path: storagePath })
      .eq('id', invoice.id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (!pdfUpdateErr && withPdf) {
      finalInvoice = withPdf as ProcessedInvoice
    }
  } catch (pdfErr) {
    console.error('[process-invoice] PDF storage failed:', pdfErr)
  }

  await insertAuditLog({
    invoice_id: invoice.id,
    user_id: userId,
    action: source === 'email_inbound' ? 'received' : 'extracted',
    details: {
      confidence: extracted.confidence,
      ucetni_kod: extracted.ucetni_kod,
      filename,
      source,
      sender_email: senderEmail,
      audit_score: auditResult.score,
      supplier_rule: !!supplierRule,
      allowance_source: allowanceSource,
      polozky_count: extracted.polozky?.length ?? 0,
    },
  })

  const notifyEmail = invoiceSettings?.notify_email?.trim() || userEmail || null
  const shouldNotify = invoiceSettings?.notify_on_new !== false && notifyEmail

  const totalAmount =
    extracted.castka_celkem != null && !Number.isNaN(Number(extracted.castka_celkem))
      ? Number(extracted.castka_celkem)
      : null

  const autoThreshold = invoiceSettings?.auto_approve_below
  const canAutoApprove =
    autoThreshold != null &&
    totalAmount != null &&
    totalAmount > 0 &&
    !auditResult.hasCritical &&
    totalAmount <= Number(autoThreshold)

  let autoApproved = false

  if (canAutoApprove) {
    const sendResult = await sendInvoiceToAccounting({
      supabase,
      userId,
      userEmail,
      fullName,
      invoice: finalInvoice,
      rememberSupplier: true,
      auditAction: 'auto_approved',
    })

    if (sendResult.ok) {
      autoApproved = true
      const { data: refreshed } = await supabase
        .from('processed_invoices')
        .select('*')
        .eq('id', invoice.id)
        .single()
      if (refreshed) finalInvoice = refreshed as ProcessedInvoice
    }
  }

  if (shouldNotify && notifyEmail && totalAmount != null) {
    await sendNewInvoiceNotification({
      to: notifyEmail,
      supplierName: extracted.dodavatel_nazev,
      amount: totalAmount,
      currency: extracted.mena ?? getDefaultCurrency(),
      invoiceId: invoice.id,
      autoApproved,
    })
  }

  return { ok: true, invoice: finalInvoice, audit: auditResult, autoApproved }
}
