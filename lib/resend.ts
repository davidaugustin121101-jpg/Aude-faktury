import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendInvoiceSentEmail(
  to: string,
  invoiceNumber: string,
  documentUrl: string
) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? 'faktury@audeflow.cz',
    to,
    subject: `Faktura ${invoiceNumber} odeslána do účetního systému`,
    html: `
      <p>Ahoj,</p>
      <p>Faktura <strong>${invoiceNumber}</strong> byla úspěšně odeslána do tvého účetního systému.</p>
      <p><a href="${documentUrl}">Otevřít v účetnictví</a></p>
      <p>— Audeflow Faktury</p>
    `,
  })
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? 'faktury@audeflow.cz',
    to,
    subject: 'Vítej v Audeflow Faktury',
    html: `
      <p>Ahoj${name ? ` ${name}` : ''},</p>
      <p>Vítej v Audeflow Faktury! Přetáhni PDF fakturu a nech Claude připravit data pro iDoklad nebo Fakturoid.</p>
      <p>— Audeflow Faktury</p>
    `,
  })
}
