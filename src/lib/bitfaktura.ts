import type { ExtractedInvoiceData } from './claude'
import { buildPredkontaceFromExtracted } from './predkontace'
import {
  buildInvoiceOutputLines,
  buildInvoicePayment,
  formatPaymentAccount,
  roundInvoiceAmount,
} from './invoice-output'

export interface BitFakturaConnection {
  domain: string
  apiToken: string
}

export function normalizeBitFakturaDomain(domain: string): string {
  const trimmed = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  return trimmed.replace(/\.bitfaktura\.cz$/i, '')
}

export function bitfakturaBaseUrl(domain: string): string {
  const slug = normalizeBitFakturaDomain(domain)
  if (!slug) throw new Error('Chybí subdoména BitFaktury')
  return `https://${slug}.bitfaktura.cz`
}

function mapAccountingKind(data: ExtractedInvoiceData): string {
  const code = data.ucetni_kod ?? ''
  if (code.startsWith('502') || code.startsWith('504')) return 'purchases'
  if (code.startsWith('518')) return 'expenses'
  if (code.startsWith('512')) return 'media'
  if (code.startsWith('521')) return 'salary'
  if (code.startsWith('501') || code.startsWith('503')) return 'fuel_expl100'
  return 'expenses'
}

function mapInvoiceKind(data: ExtractedInvoiceData): string {
  if (data.typ_faktury === 'zalohova') return 'advance'
  if (data.typ_faktury === 'danovy_doklad') return 'final'
  if (data.typ_dokladu === 'dobropis') return 'correction'
  if (data.typ_dokladu === 'proforma') return 'proforma'
  return 'vat'
}

export function buildBitFakturaInvoicePayload(
  data: ExtractedInvoiceData
): Record<string, unknown> {
  const predkontace = buildPredkontaceFromExtracted(data)
  const note = predkontace
    ? predkontace.comment
    : `Účetní kód: ${data.ucetni_kod} – ${data.ucetni_kod_nazev}`

  const positions = buildInvoiceOutputLines(data).map((line) => {
    const net = line.castkaBezDph
    const rate = line.sazbaDph
    return {
      name: line.nazev.slice(0, 255),
      tax: rate,
      total_price_gross: roundInvoiceAmount(net * (1 + rate / 100)),
      quantity: line.mnozstvi,
      unit: line.jednotka,
    }
  })

  const payment = buildInvoicePayment(data)
  const paymentAccount = formatPaymentAccount(payment)

  return {
    kind: mapInvoiceKind(data),
    income: '0',
    accounting_kind: mapAccountingKind(data),
    number: data.cislo_faktury || null,
    issue_date: data.datum_vystaveni,
    sell_date: data.datum_duzp ?? data.datum_vystaveni,
    payment_to: data.datum_splatnosti,
    delivery_date: data.datum_vystaveni,
    seller_name: data.dodavatel_nazev,
    seller_tax_no: data.dodavatel_ico || undefined,
    seller_bank_account: payment.iban ?? paymentAccount ?? undefined,
    buyer_company: '1',
    variable_symbol: data.variabilni_symbol || undefined,
    constant_symbol: data.konstantni_symbol || undefined,
    order_number: data.cislo_objednavky || undefined,
    currency: data.mena || 'CZK',
    internal_note: note,
    description: data.popis_plneni ?? undefined,
    positions,
  }
}

async function parseBitFakturaError(res: Response, raw: string): Promise<string> {
  try {
    const json = JSON.parse(raw) as { message?: string; error?: string; code?: string }
    return json.message ?? json.error ?? `HTTP ${res.status}`
  } catch {
    return raw.slice(0, 300) || `HTTP ${res.status}`
  }
}

export async function validateBitFakturaConnection(
  connection: BitFakturaConnection
): Promise<boolean> {
  try {
    const base = bitfakturaBaseUrl(connection.domain)
    const url = `${base}/invoices.json?period=this_month&page=1&per_page=1&income=no&api_token=${encodeURIComponent(connection.apiToken)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return false
    const json = (await res.json()) as unknown
    return Array.isArray(json)
  } catch {
    return false
  }
}

export async function sendToBitFaktura(
  connection: BitFakturaConnection,
  data: ExtractedInvoiceData
): Promise<{ id: string; number: string }> {
  const base = bitfakturaBaseUrl(connection.domain)
  const payload = buildBitFakturaInvoicePayload(data)

  const res = await fetch(`${base}/invoices.json`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_token: connection.apiToken,
      invoice: payload,
    }),
  })

  const raw = await res.text()
  if (!res.ok) {
    throw new Error(`BitFaktura API: ${await parseBitFakturaError(res, raw)}`)
  }

  let json: { id?: number | string; number?: string; invoice?: { id?: number | string; number?: string } }
  try {
    json = JSON.parse(raw) as typeof json
  } catch {
    throw new Error('BitFaktura vrátila neplatnou odpověď')
  }

  const invoice = json.invoice ?? json
  const id = invoice.id != null ? String(invoice.id) : null
  if (!id) throw new Error('BitFaktura nevrátila ID faktury')

  return {
    id,
    number: invoice.number ?? data.cislo_faktury ?? id,
  }
}
