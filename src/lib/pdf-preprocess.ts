import { createHash } from 'node:crypto'
import { PDFDocument } from 'pdf-lib'
import { extractText, getDocumentProxy } from 'unpdf'
import {
  PDF_MAX_PAGES,
  PDF_MAX_TEXT_CHARS,
  PDF_MIN_TEXT_CHARS,
} from '@/lib/pdf-limits'

export type PdfInputMode = 'text' | 'document'

export type PreparedPdfForExtraction = {
  pdfBuffer: Buffer
  pdfBase64: string
  pageCount: number
  text: string | null
  inputMode: PdfInputMode
  isSimple: boolean
}

export function hashPdfBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

export async function trimPdfToMaxPages(buffer: Buffer, maxPages = PDF_MAX_PAGES): Promise<{
  buffer: Buffer
  pageCount: number
  trimmed: boolean
}> {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const totalPages = src.getPageCount()
  if (totalPages <= maxPages) {
    return { buffer, pageCount: totalPages, trimmed: false }
  }

  const dst = await PDFDocument.create()
  const indices = Array.from({ length: maxPages }, (_, i) => i)
  const pages = await dst.copyPages(src, indices)
  for (const page of pages) dst.addPage(page)

  const bytes = await dst.save()
  return {
    buffer: Buffer.from(bytes),
    pageCount: maxPages,
    trimmed: true,
  }
}

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string
  pageCount: number
}> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { totalPages, text } = await extractText(pdf, { mergePages: true })
  const normalized = text.replace(/\s+/g, ' ').trim()
  return { text: normalized, pageCount: totalPages }
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n\n[text zkrácen — faktura je delší než ${maxChars} znaků]`
}

export function isSimpleTextInvoice(params: {
  pageCount: number
  textLength: number
  polozkyHint?: boolean
}): boolean {
  return params.pageCount <= 1 && params.textLength >= PDF_MIN_TEXT_CHARS && params.textLength <= 8_000
}

export async function preparePdfForExtraction(originalBuffer: Buffer): Promise<PreparedPdfForExtraction> {
  let workingBuffer = originalBuffer
  let text: string | null = null
  let effectivePageCount = 1

  try {
    const extracted = await extractPdfText(originalBuffer)
    text = extracted.text
    effectivePageCount = extracted.pageCount

    if (effectivePageCount > PDF_MAX_PAGES) {
      const trimmed = await trimPdfToMaxPages(originalBuffer)
      workingBuffer = trimmed.buffer
      effectivePageCount = trimmed.pageCount
      const reExtracted = await extractPdfText(workingBuffer)
      text = reExtracted.text
    }
  } catch (err) {
    console.warn('[pdf-preprocess] text extraction failed, using document mode:', err)
    const trimmed = await trimPdfToMaxPages(originalBuffer)
    workingBuffer = trimmed.buffer
    effectivePageCount = trimmed.pageCount
  }

  const hasUsableText = !!text && text.length >= PDF_MIN_TEXT_CHARS
  const inputMode: PdfInputMode = hasUsableText ? 'text' : 'document'
  const clippedText = hasUsableText ? truncateText(text!, PDF_MAX_TEXT_CHARS) : null

  return {
    pdfBuffer: workingBuffer,
    pdfBase64: workingBuffer.toString('base64'),
    pageCount: effectivePageCount,
    text: clippedText,
    inputMode,
    isSimple: hasUsableText
      ? isSimpleTextInvoice({ pageCount: effectivePageCount, textLength: clippedText!.length })
      : false,
  }
}
