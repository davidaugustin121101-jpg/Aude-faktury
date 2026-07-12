export type UploadInvoiceResult =
  | { ok: true; invoiceId: string }
  | { ok: false; error: string; duplicate?: boolean; existingInvoiceId?: string }

function parseErrorBody(text: string, status: number): {
  error: string
  duplicate?: boolean
  existingInvoiceId?: string
} {
  try {
    const data = JSON.parse(text) as {
      error?: string
      duplicate?: boolean
      existingInvoiceId?: string
    }
    if (data.error) {
      return {
        error: data.error,
        duplicate: data.duplicate,
        existingInvoiceId: data.existingInvoiceId,
      }
    }
  } catch {
    // not JSON
  }
  if (status === 401) return { error: 'Nejste přihlášeni. Obnovte stránku a zkuste znovu.' }
  if (status === 409) return { error: 'Faktura už existuje.' }
  if (status === 413) return { error: 'Soubor je příliš velký (max 5 MB).' }
  if (status >= 500) return { error: 'Chyba serveru při zpracování. Zkuste to za chvíli znovu.' }
  return { error: `Nahrání se nezdařilo (${status})` }
}

export async function uploadInvoicePdf(file: File): Promise<UploadInvoiceResult> {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)

  let res: Response
  try {
    res = await fetch('/api/extract', { method: 'POST', body: formData, signal: controller.signal })
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'Zpracování trvá příliš dlouho. Zkuste to znovu.' }
    }
    return { ok: false, error: 'Nepodařilo se spojit se serverem. Zkontrolujte připojení.' }
  }
  clearTimeout(timeout)

  const text = await res.text()
  if (!res.ok) {
    const parsed = parseErrorBody(text, res.status)
    return {
      ok: false,
      error: parsed.error,
      duplicate: parsed.duplicate,
      existingInvoiceId: parsed.existingInvoiceId,
    }
  }

  let data: { invoice?: { id?: string } } = {}
  try {
    data = JSON.parse(text) as { invoice?: { id?: string } }
  } catch {
    return { ok: false, error: 'Neplatná odpověď serveru' }
  }

  const invoiceId = data.invoice?.id
  if (!invoiceId) {
    return { ok: false, error: 'Neplatná odpověď serveru' }
  }

  return { ok: true, invoiceId }
}
