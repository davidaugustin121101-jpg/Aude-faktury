import { timingSafeEqual } from 'crypto'

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
