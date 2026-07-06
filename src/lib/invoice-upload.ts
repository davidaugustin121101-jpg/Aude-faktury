export type UploadInvoiceResult =
  | { ok: true; invoiceId: string }
  | { ok: false; error: string }

export async function uploadInvoicePdf(file: File): Promise<UploadInvoiceResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/extract', { method: 'POST', body: formData })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { ok: false, error: (data as { error?: string }).error ?? 'Nahrání se nezdařilo' }
  }

  const invoiceId = (data as { invoice?: { id?: string } }).invoice?.id
  if (!invoiceId) {
    return { ok: false, error: 'Neplatná odpověď serveru' }
  }

  return { ok: true, invoiceId }
}
