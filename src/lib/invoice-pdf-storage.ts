import type { SupabaseClient } from '@supabase/supabase-js'

export const INVOICE_PDF_BUCKET = 'invoice-pdfs'

/** SuperFaktura API limit pro přílohu nákladu */
export const SUPERFAKTURA_MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024

export type InvoicePdfAttachment = {
  bytes: Buffer
  filename: string
}

export function buildInvoicePdfStoragePath(userId: string, invoiceId: string): string {
  return `${userId}/${invoiceId}.pdf`
}

export function resolveInvoicePdfFilename(originalFilename: string | null | undefined): string {
  const name = originalFilename?.trim()
  if (name && name.toLowerCase().endsWith('.pdf')) return name
  if (name) return `${name}.pdf`
  return 'faktura.pdf'
}

export function canAttachToSuperFaktura(byteLength: number): boolean {
  return byteLength > 0 && byteLength <= SUPERFAKTURA_MAX_ATTACHMENT_BYTES
}

export async function saveInvoicePdf(
  admin: SupabaseClient,
  userId: string,
  invoiceId: string,
  pdfBytes: Buffer
): Promise<string> {
  const path = buildInvoicePdfStoragePath(userId, invoiceId)
  const { error } = await admin.storage.from(INVOICE_PDF_BUCKET).upload(path, pdfBytes, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (error) {
    throw new Error(`Nepodařilo se uložit PDF faktury: ${error.message}`)
  }
  return path
}

export async function loadInvoicePdf(
  admin: SupabaseClient,
  storagePath: string
): Promise<Buffer | null> {
  const { data, error } = await admin.storage.from(INVOICE_PDF_BUCKET).download(storagePath)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

export async function loadInvoicePdfAttachment(
  admin: SupabaseClient,
  storagePath: string | null | undefined,
  originalFilename: string | null | undefined
): Promise<InvoicePdfAttachment | null> {
  if (!storagePath) return null
  const bytes = await loadInvoicePdf(admin, storagePath)
  if (!bytes || bytes.length === 0) return null
  return {
    bytes,
    filename: resolveInvoicePdfFilename(originalFilename),
  }
}
