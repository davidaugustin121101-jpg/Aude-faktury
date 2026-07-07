import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractTokenFromRecipients } from '@/lib/inbound-email'
import { processInvoiceFromPdf } from '@/lib/process-invoice-from-pdf'
import { reserveInvoiceAllowance, releaseInvoiceReservation } from '@/lib/invoice-allowance'
import { getActiveWorkspace } from '@/lib/workspace'
import { verifyInboundWebhookSecret } from '@/lib/inbound-webhook-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

type InboundAttachment = {
  filename?: string
  content_type?: string
  content?: string
  contentType?: string
}

type InboundPayload = {
  from?: string
  to?: string | string[]
  subject?: string
  message_id?: string
  attachments?: InboundAttachment[]
  data?: {
    from?: string
    to?: string | string[]
    subject?: string
    message_id?: string
    attachments?: InboundAttachment[]
  }
}

function normalizeRecipients(to: string | string[] | undefined): string[] {
  if (!to) return []
  return Array.isArray(to) ? to : [to]
}

function parsePdfAttachments(attachments: InboundAttachment[] | undefined): {
  filename: string
  buffer: Buffer
}[] {
  if (!attachments?.length) return []
  const pdfs: { filename: string; buffer: Buffer }[] = []

  for (const att of attachments) {
    const type = (att.content_type ?? att.contentType ?? '').toLowerCase()
    const name = att.filename ?? 'faktura.pdf'
    const isPdf = type.includes('pdf') || name.toLowerCase().endsWith('.pdf')
    if (!isPdf || !att.content) continue

    try {
      const buffer = Buffer.from(att.content, 'base64')
      if (buffer.length > 0 && buffer.length <= 10 * 1024 * 1024) {
        pdfs.push({ filename: name, buffer })
      }
    } catch {
      // skip invalid attachment
    }
  }

  return pdfs
}

export async function POST(req: NextRequest) {
  const secretHeader =
    req.headers.get('x-inbound-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    null

  if (!verifyInboundWebhookSecret(secretHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: InboundPayload
  try {
    body = (await req.json()) as InboundPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const envelope = body.data ?? body
  const recipients = normalizeRecipients(envelope.to)
  const token = extractTokenFromRecipients(recipients)

  if (!token) {
    return NextResponse.json({ error: 'Unknown recipient' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, email, full_name')
    .eq('inbound_email_token', token)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'User not found for address' }, { status: 404 })
  }

  const pdfs = parsePdfAttachments(envelope.attachments)
  if (pdfs.length === 0) {
    return NextResponse.json({ error: 'No PDF attachment' }, { status: 400 })
  }

  const userId = profile.id as string
  const userEmail = (profile.email as string) ?? ''

  const allowance = await reserveInvoiceAllowance(userId)
  if (!allowance.ok) {
    return NextResponse.json({ error: allowance.message }, { status: 429 })
  }

  const supabase = admin
  const workspace = await getActiveWorkspace(
    supabase,
    userId,
    userEmail,
    (profile as { full_name?: string | null }).full_name
  )

  const { data: invoiceSettings } = await admin
    .from('invoice_settings')
    .select('auto_approve_below, notify_on_new, notify_email')
    .eq('user_id', userId)
    .maybeSingle()

  const results: Array<{ ok: boolean; invoiceId?: string; error?: string; duplicate?: boolean }> = []

  for (let i = 0; i < pdfs.length; i++) {
    const pdf = pdfs[i]

    let allowanceForPdf = allowance.source
    if (i > 0) {
      const next = await reserveInvoiceAllowance(userId)
      if (!next.ok) {
        results.push({ ok: false, error: next.message })
        break
      }
      allowanceForPdf = next.source
    }

    const result = await processInvoiceFromPdf({
      supabase,
      admin,
      userId,
      userEmail,
      fullName: (profile as { full_name?: string | null }).full_name,
      workspaceId: workspace.id,
      pdfBuffer: pdf.buffer,
      filename: pdf.filename,
      source: 'email_inbound',
      senderEmail: envelope.from ?? null,
      originalEmailId: envelope.message_id ?? null,
      receivedAt: new Date().toISOString(),
      allowanceSource: allowanceForPdf,
      invoiceSettings,
    })

    if (!result.ok) {
      if (i === 0 && allowanceForPdf) {
        await releaseInvoiceReservation(userId, allowanceForPdf)
      }
      results.push({
        ok: false,
        error: result.duplicate ? result.message : result.error,
        duplicate: result.duplicate,
      })
      continue
    }

    results.push({ ok: true, invoiceId: result.invoice.id })
  }

  const processed = results.filter((r) => r.ok).length
  return NextResponse.json({ processed, results })
}
