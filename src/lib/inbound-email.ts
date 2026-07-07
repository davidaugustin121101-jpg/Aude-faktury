export const INBOUND_EMAIL_DOMAIN =
  process.env.INBOUND_EMAIL_DOMAIN?.trim().toLowerCase() || 'in.audeflow.cz'

export function buildInboundEmailAddress(token: string): string {
  const safe = token.trim().toLowerCase()
  return `${safe}@${INBOUND_EMAIL_DOMAIN}`
}

/** Parse local part from recipient address (e.g. abc123 from abc123@in.audeflow.cz) */
export function parseInboundEmailToken(recipient: string): string | null {
  const email = recipient.trim().toLowerCase()
  const at = email.lastIndexOf('@')
  if (at <= 0) return null
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (domain !== INBOUND_EMAIL_DOMAIN) return null
  if (!/^[a-z0-9]{6,16}$/.test(local)) return null
  return local
}

export function extractTokenFromRecipients(recipients: string[]): string | null {
  for (const r of recipients) {
    const token = parseInboundEmailToken(r)
    if (token) return token
  }
  return null
}
