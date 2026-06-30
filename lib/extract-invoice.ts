import type { SupabaseClient } from '@supabase/supabase-js'
import { extractInvoiceFromPdf, type ExtractedInvoice } from '@/lib/claude'
import { lookupSupplierRule, applySupplierRule } from '@/lib/supplier-rules'
import { findDuplicateInvoice, duplicateWarningMessage } from '@/lib/duplicate-check'

export type ExtractResult = {
  invoice: Record<string, unknown>
  fromMemory: boolean
  duplicateOf: string | null
  duplicateWarning: string | null
}

function toDbRow(
  userId: string,
  workspaceId: string,
  extracted: ExtractedInvoice,
  filename: string,
  opts?: { duplicateOf?: string | null; isDuplicate?: boolean }
) {
  const { iban: _ignoredIban, ...fields } = extracted
  void _ignoredIban
  return {
    user_id: userId,
    workspace_id: workspaceId,
    ...fields,
    original_filename: filename,
    status: 'pending_review' as const,
    duplicate_of: opts?.duplicateOf ?? null,
    is_duplicate: opts?.isDuplicate ?? false,
  }
}

export async function processInvoicePdf(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  file: { name: string; buffer: ArrayBuffer }
): Promise<ExtractResult> {
  const base64 = Buffer.from(file.buffer).toString('base64')
  let extracted = await extractInvoiceFromPdf(base64)
  let fromMemory = false

  const rule = await lookupSupplierRule(
    supabase,
    workspaceId,
    extracted.dodavatel_ico,
    extracted.dodavatel_nazev
  )
  if (rule) {
    extracted = applySupplierRule(extracted, rule)
    fromMemory = true
  }

  const duplicate = await findDuplicateInvoice(
    supabase,
    workspaceId,
    extracted.dodavatel_ico,
    extracted.cislo_faktury
  )

  if (duplicate) {
    extracted = {
      ...extracted,
      problemy: [...(extracted.problemy ?? []), duplicateWarningMessage(duplicate)],
    }
  }

  const { data: invoice, error: dbError } = await supabase
    .from('processed_invoices')
    .insert(
      toDbRow(userId, workspaceId, extracted, file.name, {
        duplicateOf: duplicate?.id ?? null,
        isDuplicate: Boolean(duplicate),
      })
    )
    .select()
    .single()

  if (dbError || !invoice) {
    throw new Error(dbError?.message ?? 'Chyba uložení faktury')
  }

  const pdfPath = `${userId}/${invoice.id}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('invoice-pdfs')
    .upload(pdfPath, file.buffer, { contentType: 'application/pdf', upsert: true })

  if (!uploadError) {
    await supabase
      .from('processed_invoices')
      .update({ pdf_storage_path: pdfPath })
      .eq('id', invoice.id)
  }

  await supabase.from('invoice_audit_log').insert({
    invoice_id: invoice.id,
    user_id: userId,
    action: 'extracted',
    details: {
      filename: file.name,
      confidence: extracted.confidence,
      ucetni_kod: extracted.ucetni_kod,
      from_memory: fromMemory,
      is_duplicate: Boolean(duplicate),
    },
  })

  return {
    invoice,
    fromMemory,
    duplicateOf: duplicate?.id ?? null,
    duplicateWarning: duplicate ? duplicateWarningMessage(duplicate) : null,
  }
}
