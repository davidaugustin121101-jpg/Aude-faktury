import { PDF_MAX_BYTES } from '@/lib/pdf-limits'

type ResendAttachmentMeta = {
  id?: string
  filename?: string
  content_type?: string
}

export type ResendReceivedEvent = {
  type?: string
  data?: {
    email_id?: string
    from?: string
    to?: string | string[]
    message_id?: string
    subject?: string
    attachments?: ResendAttachmentMeta[]
  }
}

type ResendAttachmentListItem = {
  id: string
  filename: string
  content_type: string
  download_url: string
}

function isPdfAttachment(att: { filename?: string; content_type?: string }): boolean {
  const type = (att.content_type ?? '').toLowerCase()
  const name = (att.filename ?? '').toLowerCase()
  return type.includes('pdf') || name.endsWith('.pdf')
}

export async function fetchPdfAttachmentsFromResendEmail(
  emailId: string
): Promise<{ filename: string; buffer: Buffer }[]> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Chybí RESEND_API_KEY pro stažení příloh')
  }

  const listRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}/attachments`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!listRes.ok) {
    throw new Error(`Resend attachments list ${listRes.status}`)
  }

  const listJson = (await listRes.json()) as { data?: ResendAttachmentListItem[] }
  const attachments = listJson.data ?? []
  const pdfs: { filename: string; buffer: Buffer }[] = []

  for (const att of attachments) {
    if (!isPdfAttachment(att) || !att.download_url) continue

    const fileRes = await fetch(att.download_url)
    if (!fileRes.ok) continue

    const buffer = Buffer.from(await fileRes.arrayBuffer())
    if (buffer.length > 0 && buffer.length <= PDF_MAX_BYTES) {
      pdfs.push({ filename: att.filename || 'faktura.pdf', buffer })
    }
  }

  return pdfs
}

export function parseResendReceivedEvent(body: unknown): ResendReceivedEvent['data'] | null {
  if (!body || typeof body !== 'object') return null
  const event = body as ResendReceivedEvent
  if (event.type !== 'email.received' || !event.data?.email_id) return null
  return event.data
}
