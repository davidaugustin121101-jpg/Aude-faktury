import type { SupabaseClient } from '@supabase/supabase-js'
import { getDefaultCurrency } from '@/lib/accounting-codes'
import { sendNewInvoiceNotification } from '@/lib/notifications'
import { sendInvoiceToAccounting } from '@/lib/send-invoice'
import { saveInvoicePdf } from '@/lib/invoice-pdf-storage'
import type { ProcessedInvoice } from '@/types/invoices'
import type { FinalizedExtractedInvoice } from '@/lib/polozky-predkontace'
import type { AuditResult } from '@/lib/invoice-audit/types'
import type { AllowanceSource } from '@/lib/invoice-allowance'

type BackgroundFinalizeInput = {
  admin: SupabaseClient
  supabase: SupabaseClient
  userId: string
  userEmail: string
  fullName?: string | null
  invoiceId: string
  pdfBuffer: Buffer
  extracted: FinalizedExtractedInvoice
  auditResult: AuditResult
  allowanceSource: AllowanceSource
  invoiceSettings?: {
    auto_approve_below?: number | null
    notify_on_new?: boolean | null
    notify_email?: string | null
  } | null
}

export function scheduleInvoiceBackgroundFinalize(input: BackgroundFinalizeInput): void {
  void runInvoiceBackgroundFinalize(input).catch((err) => {
    console.error('[process-invoice] background finalize failed:', err)
  })
}

async function runInvoiceBackgroundFinalize(input: BackgroundFinalizeInput): Promise<void> {
  const {
    admin,
    supabase,
    userId,
    userEmail,
    fullName,
    invoiceId,
    pdfBuffer,
    extracted,
    auditResult,
    allowanceSource,
    invoiceSettings,
  } = input

  try {
    const storagePath = await saveInvoicePdf(admin, userId, invoiceId, pdfBuffer)
    await supabase
      .from('processed_invoices')
      .update({ storage_path: storagePath })
      .eq('id', invoiceId)
      .eq('user_id', userId)
  } catch (pdfErr) {
    console.error('[process-invoice] background PDF storage failed:', pdfErr)
  }

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

  if (canAutoApprove) {
    const { data: invoiceRow } = await supabase
      .from('processed_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .maybeSingle()

    if (invoiceRow) {
      await sendInvoiceToAccounting({
        supabase,
        userId,
        userEmail,
        fullName,
        invoice: invoiceRow as ProcessedInvoice,
        rememberSupplier: true,
        auditAction: 'auto_approved',
      })
    }
  }

  const notifyEmail = invoiceSettings?.notify_email?.trim() || userEmail || null
  const shouldNotify = invoiceSettings?.notify_on_new !== false && notifyEmail
  if (shouldNotify && notifyEmail && totalAmount != null) {
    await sendNewInvoiceNotification({
      to: notifyEmail,
      supplierName: extracted.dodavatel_nazev,
      amount: totalAmount,
      currency: extracted.mena ?? getDefaultCurrency(),
      invoiceId,
      autoApproved: canAutoApprove,
    })
  }
}
