import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

type UploadInvoiceResult =
  | { ok: true; invoiceId: string }
  | { ok: false; error: string }

async function consumeNdjsonStreamOld(
  chunks: Uint8Array[]
): Promise<UploadInvoiceResult> {
  const encoder = new TextEncoder()
  let chunkIndex = 0
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (chunkIndex >= chunks.length) {
        controller.close()
        return
      }
      controller.enqueue(chunks[chunkIndex++])
    },
  })

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: UploadInvoiceResult = { ok: false, error: 'Neplatná odpověď serveru' }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      const event = JSON.parse(line) as { type: string; invoice?: { id: string } }
      if (event.type === 'done') {
        result = { ok: true, invoiceId: event.invoice!.id }
      }
    }
  }

  return result
}

async function consumeNdjsonStreamNew(
  chunks: Uint8Array[]
): Promise<UploadInvoiceResult> {
  let chunkIndex = 0
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (chunkIndex >= chunks.length) {
        controller.close()
        return
      }
      controller.enqueue(chunks[chunkIndex++])
    },
  })

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: UploadInvoiceResult = { ok: false, error: 'Neplatná odpověď serveru' }

  const parseLine = (line: string) => {
    if (!line.trim()) return
    const event = JSON.parse(line) as { type: string; invoice?: { id: string } }
    if (event.type === 'done') {
      const invoiceId = event.invoice?.id
      if (invoiceId) result = { ok: true, invoiceId: String(invoiceId) }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (value) buffer += decoder.decode(value, { stream: !done })
    if (done) break
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) parseLine(line)
  }

  buffer += decoder.decode()
  if (buffer.trim()) parseLine(buffer)

  return result
}

function encodeLines(lines: string[], splitAt?: number): Uint8Array[] {
  const text = lines.join('\n') + (lines.length ? '\n' : '')
  if (splitAt == null) return [new TextEncoder().encode(text)]
  return [
    new TextEncoder().encode(text.slice(0, splitAt)),
    new TextEncoder().encode(text.slice(splitAt)),
  ]
}

describe('NDJSON stream consumer', () => {
  const progress = JSON.stringify({ type: 'progress', percent: 50, label: 'AI…', phase: 'extract' })
  const done = JSON.stringify({ type: 'done', invoice: { id: 'inv-123' } })

  it('old parser fails when done line has no trailing newline', async () => {
    const chunks = [new TextEncoder().encode(`${progress}\n${done}`)]
    const result = await consumeNdjsonStreamOld(chunks)
    assert.equal(result.ok, false)
  })

  it('new parser succeeds when done line has no trailing newline', async () => {
    const chunks = [new TextEncoder().encode(`${progress}\n${done}`)]
    const result = await consumeNdjsonStreamNew(chunks)
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.invoiceId, 'inv-123')
  })

  it('new parser succeeds with chunked delivery', async () => {
    const chunks = encodeLines([progress, done], progress.length + 1)
    const result = await consumeNdjsonStreamNew(chunks)
    assert.equal(result.ok, true)
  })
})

describe('upload network error messages', () => {
  function normalize(message: string): string {
    const lower = message.toLowerCase()
    const isNetwork =
      lower === 'load failed' ||
      lower.includes('failed to fetch') ||
      lower.includes('networkerror')
    return isNetwork
      ? 'Spojení se serverem bylo přerušeno. Zkontrolujte přehled faktur — zpracování mohlo proběhnout na pozadí.'
      : message
  }

  it('maps Safari Load failed to Czech message', () => {
    assert.equal(
      normalize('Load failed'),
      'Spojení se serverem bylo přerušeno. Zkontrolujte přehled faktur — zpracování mohlo proběhnout na pozadí.'
    )
  })
})
