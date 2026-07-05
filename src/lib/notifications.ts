import { Resend } from 'resend'
import { APP_NAME } from '@/lib/brand'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendNewInvoiceNotification(params: {
  to: string
  supplierName: string | null
  amount: number | null
  currency: string
  invoiceId: string
  autoApproved?: boolean
}) {
  const resend = getResend()
  if (!resend) return

  const from = process.env.RESEND_FROM_EMAIL ?? 'Faktury Audeflow <noreply@audeflow.cz>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://faktury.audeflow.cz'
  const amountStr =
    params.amount != null
      ? new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency: params.currency,
        }).format(params.amount)
      : '—'

  const subject = params.autoApproved
    ? `${APP_NAME}: Faktura automaticky odeslána`
    : `${APP_NAME}: Nová faktura vytěžena`

  const body = params.autoApproved
    ? `Faktura od ${params.supplierName ?? 'dodavatele'} (${amountStr}) byla automaticky odeslána do účetnictví.`
    : `Nová faktura od ${params.supplierName ?? 'dodavatele'} (${amountStr}) je připravena — exportujte soubor nebo odešlete do fakturačního systému.`

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject,
      html: `<p>${body}</p><p><a href="${appUrl}/faktury/${params.invoiceId}">Otevřít fakturu</a></p>`,
    })
  } catch (err) {
    console.error('[notify] send failed:', err)
  }
}
