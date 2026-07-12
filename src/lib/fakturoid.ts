import type { ExtractedInvoiceData } from './claude'
import { buildPredkontaceFromExtracted } from './predkontace'
import { FAKTUROID_USER_AGENT, getFakturoidAccessToken, type FakturoidConnectionRow, connectFakturoidWithClientCredentials, tokenExpiresAt } from './fakturoid-auth'
import {
  buildInvoiceOutputLines,
  buildInvoicePayment,
  formatPaymentAccount,
} from './invoice-output'

const FAKTUROID_BASE = 'https://app.fakturoid.cz/api/v3'

type FakturoidErrorBody = {
  error?: string
  error_description?: string
}

export function formatFakturoidApiError(status: number, body: string): string {
  try {
    const json = JSON.parse(body) as FakturoidErrorBody
    if (json.error === 'upgrade_required') {
      return (
        'Váš tarif Fakturoid neumožňuje vytváření nákladů přes API. ' +
        'Potřebujete placený tarif Fakturoid s plným API přístupem (zdarma tarif API nepodporuje). ' +
        'Upgrade: Fakturoid → Nastavení → Tarif, nebo použijte iDoklad / SuperFaktura.'
      )
    }
    if (json.error_description) return json.error_description
    if (json.error) return json.error
  } catch {
    // raw text fallback
  }
  return body || `HTTP ${status}`
}

export function buildFakturoidExpensePayload(data: ExtractedInvoiceData) {
  const predkontace = buildPredkontaceFromExtracted(data)
  const payment = buildInvoicePayment(data)
  const paymentAccount = formatPaymentAccount(payment)
  const lines = buildInvoiceOutputLines(data)

  const noteParts = [
    predkontace?.comment,
    data.popis_plneni || undefined,
    data.konstantni_symbol ? `KS: ${data.konstantni_symbol}` : undefined,
    data.cislo_objednavky ? `Objednávka: ${data.cislo_objednavky}` : undefined,
    !payment.iban && paymentAccount ? `Účet: ${paymentAccount}` : undefined,
  ].filter(Boolean)

  return {
    original_number: data.cislo_faktury || undefined,
    issued_on: data.datum_vystaveni,
    due_on: data.datum_splatnosti,
    taxable_fulfillment_due: data.datum_duzp ?? data.datum_vystaveni,
    variable_symbol: data.variabilni_symbol || undefined,
    document_type: 'invoice',
    vat_price_mode: 'without_vat',
    note: noteParts.join(' | ') || undefined,
    currency: data.mena || 'CZK',
    supplier_name: data.dodavatel_nazev,
    supplier_registration_no: data.dodavatel_ico || undefined,
    ...(data.dodavatel_dic ? { supplier_vat_no: data.dodavatel_dic } : {}),
    ...(payment.iban ? { iban: payment.iban } : {}),
    ...(payment.swift ? { swift_bic: payment.swift } : {}),
    lines: lines.map((line) => ({
      name: line.nazev.slice(0, 200),
      quantity: String(line.mnozstvi),
      unit_name: line.jednotka,
      unit_price: String(line.jednotkovaCena),
      vat_rate: String(line.sazbaDph),
    })),
    tags: [predkontace?.display ?? data.ucetni_kod ?? '518'],
  }
}

/** Ověří, že účet umí vytvářet náklady přes API (ne jen číst). */
export async function validateFakturoidExpenseWrite(
  token: string,
  accountSlug: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch(`${FAKTUROID_BASE}/accounts/${accountSlug}/expenses.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': FAKTUROID_USER_AGENT,
      Accept: 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (res.status === 422) return { ok: true }

  if (res.status === 403) {
    const text = await res.text()
    return { ok: false, message: formatFakturoidApiError(403, text) }
  }

  if (res.ok) return { ok: true }

  const text = await res.text()
  return { ok: false, message: formatFakturoidApiError(res.status, text) }
}

export async function sendToFakturoid(
  connection: FakturoidConnectionRow,
  data: ExtractedInvoiceData
): Promise<{ id: string; number: string }> {
  const { token, slug } = await getFakturoidAccessToken(connection)
  const payload = buildFakturoidExpensePayload(data)

  const res = await fetch(`${FAKTUROID_BASE}/accounts/${slug}/expenses.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': FAKTUROID_USER_AGENT,
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(formatFakturoidApiError(res.status, err))
  }

  const result = (await res.json()) as { id: number; number: string }
  return { id: String(result.id), number: result.number }
}

export async function validateFakturoidToken(
  token: string,
  accountSlug: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${FAKTUROID_BASE}/accounts/${accountSlug}/expenses.json?page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': FAKTUROID_USER_AGENT,
          Accept: 'application/json',
        },
      }
    )
    return res.ok
  } catch {
    return false
  }
}

export async function validateFakturoidClientCredentials(
  clientId: string,
  clientSecret: string
): Promise<{ ok: true; slug: string; token: string; expiresAt: string } | { ok: false; message?: string }> {
  try {
    const result = await connectFakturoidWithClientCredentials(clientId, clientSecret)
    const writeCheck = await validateFakturoidExpenseWrite(
      result.access_token,
      result.account.slug
    )
    if (!writeCheck.ok) {
      return { ok: false, message: writeCheck.message }
    }
    return {
      ok: true,
      slug: result.account.slug,
      token: result.access_token,
      expiresAt: tokenExpiresAt(result.expires_in),
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Neplatné Fakturoid API klíče',
    }
  }
}
