import {
  EXTRACTION_LLM_PROGRESS_CAP,
  EXTRACTION_PROGRESS,
  type ExtractionProgressUpdate,
} from '@/lib/extraction-progress'

export type UploadInvoiceResult =
  | { ok: true; invoiceId: string }
  | {
      ok: false
      error: string
      duplicate?: boolean
      existingInvoiceId?: string
    }

export type UploadProgressHandler = (update: ExtractionProgressUpdate) => void

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

function createLlmProgressTicker(onProgress: UploadProgressHandler): {
  start: () => void
  stop: () => void
} {
  let timer: ReturnType<typeof setInterval> | null = null
  let current = EXTRACTION_PROGRESS.extract.percent

  return {
    start() {
      stop()
      timer = setInterval(() => {
        if (current >= EXTRACTION_LLM_PROGRESS_CAP) return
        current += 1
        onProgress({
          percent: current,
          label: EXTRACTION_PROGRESS.extract.label,
          phase: 'extract',
        })
      }, 450)
    },
    stop() {
      if (timer) clearInterval(timer)
      timer = null
    },
  }
}

function startClientProgress(onProgress: UploadProgressHandler): ReturnType<typeof createLlmProgressTicker> {
  onProgress({ percent: 2, label: 'Nahrávám soubor…', phase: 'upload' })
  onProgress(EXTRACTION_PROGRESS.hash)
  onProgress(EXTRACTION_PROGRESS.prepare)
  onProgress(EXTRACTION_PROGRESS.extract)
  const ticker = createLlmProgressTicker(onProgress)
  ticker.start()
  return ticker
}

function finishClientProgress(onProgress: UploadProgressHandler | undefined): void {
  if (!onProgress) return
  onProgress(EXTRACTION_PROGRESS.postprocess)
  onProgress(EXTRACTION_PROGRESS.audit)
  onProgress(EXTRACTION_PROGRESS.save)
  onProgress(EXTRACTION_PROGRESS.done)
}

export async function uploadInvoicePdf(
  file: File,
  onProgress?: UploadProgressHandler
): Promise<UploadInvoiceResult> {
  const llmTicker = onProgress ? startClientProgress(onProgress) : null

  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)

  let res: Response
  try {
    res = await fetch('/api/extract', { method: 'POST', body: formData, signal: controller.signal })
  } catch (err) {
    clearTimeout(timeout)
    llmTicker?.stop()
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'Zpracování trvá příliš dlouho. Zkuste to znovu.' }
    }
    return { ok: false, error: 'Nepodařilo se spojit se serverem. Zkontrolujte připojení.' }
  }
  clearTimeout(timeout)
  llmTicker?.stop()

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

  finishClientProgress(onProgress)
  return { ok: true, invoiceId }
}
