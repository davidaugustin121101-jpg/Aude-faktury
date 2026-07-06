import type { ExtractedInvoiceData } from './claude'
import { buildPredkontaceFromExtracted } from './predkontace'
import {
  canAttachToSuperFaktura,
  type InvoicePdfAttachment,
} from './invoice-pdf-storage'

const MODULE_NAME = 'AudeflowFaktury'
const SUPERFAKTURA_BASE = 'https://moje.superfaktura.cz'

export interface SuperFakturaConnection {
  email: string
  apiKey: string
  companyId: string
}

function buildAuthHeader(email: string, apiKey: string, companyId: string): string {
  const parts = [
    `email=${encodeURIComponent(email)}`,
    `apikey=${encodeURIComponent(apiKey)}`,
    `module=${encodeURIComponent(MODULE_NAME)}`,
  ]
  if (companyId) {
    parts.push(`company_id=${encodeURIComponent(companyId)}`)
  }
  return `SFAPI ${parts.join('&')}`
}

type SuperFakturaResponse<T = unknown> = {
  error?: number
  error_message?: string | Record<string, string[]>
  message?: string
  data?: T
}

function formatSuperFakturaError(json: SuperFakturaResponse): string {
  const msg = json.error_message ?? json.message
  if (typeof msg === 'string') return msg
  if (msg && typeof msg === 'object') {
    return Object.entries(msg)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('; ')
  }
  return 'Neznámá chyba SuperFaktura API'
}

export async function validateSuperFakturaConnection(
  connection: SuperFakturaConnection
): Promise<boolean> {
  try {
    const res = await fetch(`${SUPERFAKTURA_BASE}/expenses/index.json/listinfo:1/per_page:1/page:1`, {
      headers: { Authorization: buildAuthHeader(connection.email, connection.apiKey, connection.companyId) },
    })
    if (!res.ok) return false
    const json = (await res.json()) as SuperFakturaResponse
    return json.error !== 1
  } catch {
    return false
  }
}

export async function sendToSuperFaktura(
  connection: SuperFakturaConnection,
  data: ExtractedInvoiceData,
  pdf?: InvoicePdfAttachment | null
): Promise<{ id: string; number: string; pdfAttached: boolean }> {
  const predkontace = buildPredkontaceFromExtracted(data)
  const expenseComment = predkontace
    ? predkontace.comment
    : `Účetní kód: ${data.ucetni_kod} – ${data.ucetni_kod_nazev}`

  const includePdf = pdf ? canAttachToSuperFaktura(pdf.bytes.length) : false
  if (pdf && !includePdf) {
    console.warn(
      `[superfaktura] PDF příloha přeskočena (${pdf.bytes.length} B > limit 4 MB)`
    )
  }

  const payload = {
    Expense: {
      name: (data.popis_plneni ?? `Faktura ${data.cislo_faktury}`).slice(0, 200),
      document_number: data.cislo_faktury || undefined,
      created: data.datum_vystaveni,
      due: data.datum_splatnosti,
      variable: data.variabilni_symbol || undefined,
      currency: data.mena || 'CZK',
      vat: String(data.sazba_dph ?? 21),
      amount: data.castka_bez_dph ?? data.castka_celkem ?? 0,
      version: 'basic',
      type: 'invoice',
      comment: expenseComment,
      ...(includePdf ? { attachment: pdf!.bytes.toString('base64') } : {}),
    },
    Client: {
      name: data.dodavatel_nazev,
      ico: data.dodavatel_ico || undefined,
      dic: data.dodavatel_dic?.replace(/^(SK|CZ)/i, '') || undefined,
      update_addressbook: 1,
      ...(data.iban ? { iban: data.iban } : {}),
    },
  }

  const body = new URLSearchParams()
  body.set('data', JSON.stringify(payload))

  const res = await fetch(`${SUPERFAKTURA_BASE}/expenses/add`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(connection.email, connection.apiKey, connection.companyId),
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Accept: 'application/json',
    },
    body: body.toString(),
  })

  const raw = await res.text()
  let json: SuperFakturaResponse<{
    Expense?: { id?: string; number?: string; expense_no?: string }
  }>
  try {
    json = JSON.parse(raw) as typeof json
  } catch {
    throw new Error(
      `SuperFaktura API chyba ${res.status}: ${raw.slice(0, 300) || 'neplatná odpověď serveru'}`
    )
  }

  if (!res.ok || json.error === 1) {
    throw new Error(`SuperFaktura API: ${formatSuperFakturaError(json)}`)
  }

  const expense = json.data?.Expense
  if (!expense?.id) {
    throw new Error('SuperFaktura nevrátila ID nákladu')
  }

  return {
    id: String(expense.id),
    number: expense.number ?? expense.expense_no ?? expense.id,
    pdfAttached: includePdf,
  }
}
