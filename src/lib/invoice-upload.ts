export type UploadInvoiceResult =
  | { ok: true; invoiceId: string }
  | { ok: false; error: string }

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
    // #region agent log
    fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',location:'invoice-upload.ts:fetch-error',message:'extract fetch failed',data:{aborted:err instanceof Error&&err.name==='AbortError',error:err instanceof Error?err.message:'unknown'},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'Zpracování trvá příliš dlouho. Zkuste to znovu.' }
    }
    return { ok: false, error: 'Nahrání se nezdařilo' }
  }
  clearTimeout(timeout)

  const data = await res.json().catch(() => ({}))
  // #region agent log
  fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',location:'invoice-upload.ts:fetch-response',message:'extract response',data:{status:res.status,ok:res.ok,hasInvoiceId:!!(data as {invoice?:{id?:string}}).invoice?.id},timestamp:Date.now(),hypothesisId:'D,E,F'})}).catch(()=>{});
  // #endregion

  if (!res.ok) {
    return { ok: false, error: (data as { error?: string }).error ?? 'Nahrání se nezdařilo' }
  }

  const invoiceId = (data as { invoice?: { id?: string } }).invoice?.id
  if (!invoiceId) {
    return { ok: false, error: 'Neplatná odpověď serveru' }
  }

  return { ok: true, invoiceId }
}
