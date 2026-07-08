import { timingSafeEqual } from 'crypto'
import { Webhook } from 'svix'

export function verifyInboundWebhookSecret(header: string | null): boolean {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET?.trim()
  if (!secret) return false
  if (!header) return false
  try {
    const a = Buffer.from(header)
    const b = Buffer.from(secret)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return header === secret
  }
}

export function verifyResendWebhook(
  payload: string,
  headers: {
    id: string | null
    timestamp: string | null
    signature: string | null
  }
): unknown | null {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  if (!secret) return null
  if (!headers.id || !headers.timestamp || !headers.signature) return null

  try {
    const wh = new Webhook(secret)
    return wh.verify(payload, {
      'svix-id': headers.id,
      'svix-timestamp': headers.timestamp,
      'svix-signature': headers.signature,
    })
  } catch {
    return null
  }
}
