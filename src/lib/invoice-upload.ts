import type { ExtractionProgressUpdate, ExtractionStreamEvent } from '@/lib/extraction-progress'
import { EXTRACTION_LLM_PROGRESS_CAP } from '@/lib/extraction-progress'

export type UploadInvoiceResult =
  | { ok: true; invoiceId: string }
  | {
      ok: false
      error: string
      duplicate?: boolean
      existingInvoiceId?: string
      /** Stream spadl, ale server mohl fakturu stihnout uložit */
      maybeProcessed?: boolean
    }

export type UploadProgressHandler = (update: ExtractionProgressUpdate) => void

const STREAM_LIKELY_DONE_PERCENT = 90

function isNetworkStreamError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower === 'load failed' ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('the operation was aborted') ||
    lower.includes('aborted')
  )
}

function normalizeUploadErrorMessage(message: string): string {
  if (isNetworkStreamError(message)) {
    return 'Spojení se serverem bylo přerušeno. Zkontrolujte přehled faktur — zpracování mohlo proběhnout na pozadí.'
  }
  return message
}

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
  let current = 28

  return {
    start() {
      stop()
      timer = setInterval(() => {
        if (current >= EXTRACTION_LLM_PROGRESS_CAP) return
        current += 1
        onProgress({
          percent: current,
          label: 'AI vytěžuje data…',
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

async function consumeNdjsonStream(
  body: ReadableStream<Uint8Array>,
  onProgress?: UploadProgressHandler
): Promise<UploadInvoiceResult> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: UploadInvoiceResult = { ok: false, error: 'Neplatná odpověď serveru' }
  const llmTicker = onProgress ? createLlmProgressTicker(onProgress) : null
  let llmPhaseActive = false
  let maxProgressPercent = 0

  const parseLine = (line: string) => {
    if (!line.trim()) return
    let event: ExtractionStreamEvent
    try {
      event = JSON.parse(line) as ExtractionStreamEvent
    } catch {
      return
    }

    if (event.type === 'progress') {
      maxProgressPercent = Math.max(maxProgressPercent, event.percent)
      if (event.phase === 'extract') {
        if (!llmPhaseActive) {
          llmPhaseActive = true
          llmTicker?.start()
        }
        onProgress?.(event)
      } else {
        if (llmPhaseActive) {
          llmPhaseActive = false
          llmTicker?.stop()
        }
        onProgress?.(event)
      }
    }

    if (event.type === 'done') {
      llmTicker?.stop()
      const invoiceId = event.invoice?.id
      if (invoiceId) {
        result = { ok: true, invoiceId: String(invoiceId) }
      }
    }

    if (event.type === 'error') {
      llmTicker?.stop()
      result = {
        ok: false,
        error: event.error,
        duplicate: event.duplicate,
        existingInvoiceId: event.existingInvoiceId,
      }
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (value) {
        buffer += decoder.decode(value, { stream: !done })
      }
      if (done) break

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        parseLine(line)
      }
    }

    buffer += decoder.decode()
    if (buffer.trim()) {
      parseLine(buffer)
    }
  } catch (err) {
    llmTicker?.stop()
    const message = err instanceof Error ? err.message : ''
    if (maxProgressPercent >= STREAM_LIKELY_DONE_PERCENT && isNetworkStreamError(message)) {
      return {
        ok: false,
        error: normalizeUploadErrorMessage(message),
        maybeProcessed: true,
      }
    }
    throw err
  }

  llmTicker?.stop()
  return result
}

export async function uploadInvoicePdf(
  file: File,
  onProgress?: UploadProgressHandler
): Promise<UploadInvoiceResult> {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)

  const endpoint = onProgress ? '/api/extract?stream=1' : '/api/extract'

  let res: Response
  try {
    res = await fetch(endpoint, { method: 'POST', body: formData, signal: controller.signal })
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'Zpracování trvá příliš dlouho. Zkuste to znovu.' }
    }
    const message = err instanceof Error ? err.message : ''
    return {
      ok: false,
      error: normalizeUploadErrorMessage(message || 'Nepodařilo se spojit se serverem. Zkontrolujte připojení.'),
    }
  }
  clearTimeout(timeout)

  if (onProgress && res.body && res.ok) {
    try {
      return await consumeNdjsonStream(res.body, onProgress)
    } catch (err) {
      return {
        ok: false,
        error: normalizeUploadErrorMessage(
          err instanceof Error ? err.message : 'Chyba při čtení odpovědi serveru'
        ),
      }
    }
  }

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

  onProgress?.({ percent: 100, label: 'Hotovo', phase: 'done' })
  return { ok: true, invoiceId }
}
