import type { ExtractedInvoiceData } from './claude'
import type { CountryCode } from './accounting-codes'

const MODULE_NAME = 'AudeflowFaktury'

const BASE_URLS: Record<CountryCode, string> = {
  sk: 'https://moja.superfaktura.sk',
  cz: 'https://moje.superfaktura.cz',
}

export interface SuperFakturaConnection {
  email: string
  apiKey: string
  companyId: string
  country: CountryCode
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
    const base = BASE_URLS[connection.country]
    const res = await fetch(`${base}/expenses/index.json/listinfo:1/per_page:1/page:1`, {
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
  data: ExtractedInvoiceData
): Promise<{ id: string; number: string }> {
  const base = BASE_URLS[connection.country]
  const commentPrefix = connection.country === 'sk' ? 'Účtovný kód' : 'Účetní kód'

  const payload = {
    Expense: {
      name: (data.popis_plneni ?? `Faktura ${data.cislo_faktury}`).slice(0, 200),
      document_number: data.cislo_faktury || undefined,
      created: data.datum_vystaveni,
      due: data.datum_splatnosti,
      variable: data.variabilni_symbol || undefined,
      currency: data.mena || (connection.country === 'sk' ? 'EUR' : 'CZK'),
      vat: String(data.sazba_dph ?? (connection.country === 'sk' ? 20 : 21)),
      amount: data.castka_bez_dph ?? data.castka_celkem ?? 0,
      version: 'basic',
      type: 'invoice',
      comment: `${commentPrefix}: ${data.ucetni_kod} – ${data.ucetni_kod_nazev}`,
    },
    Client: {
      name: data.dodavatel_nazev,
      ico: data.dodavatel_ico || undefined,
      dic: data.dodavatel_dic?.replace(/^(SK|CZ)/i, '') || undefined,
      update_addressbook: 1,
      ...(data.iban ? { iban: data.iban } : {}),
    },
  }

  // SuperFaktura API expects form-urlencoded body with JSON in the `data` field (not raw JSON).
  const body = new URLSearchParams()
  body.set('data', JSON.stringify(payload))

  const res = await fetch(`${base}/expenses/add`, {
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
  }
}
