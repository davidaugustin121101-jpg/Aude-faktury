import type { ExtractedInvoiceData } from './claude'
import { buildPredkontaceFromExtracted } from './predkontace'

const IDOKLAD_API_BASE = 'https://api.idoklad.cz/v3'
const IDOKLAD_TOKEN_URL = 'https://app.idoklad.cz/identity/server/connect/token'

/** iDoklad DocumentType enum – 1 = přijaté faktury */
const RECEIVED_INVOICE_DOCUMENT_TYPE = 1

/** PriceType: 1 = cena bez DPH */
const PRICE_TYPE_WITHOUT_VAT = 1

type IdokladApiEnvelope<T> = {
  Data?: T
  IsSuccess?: boolean
  Message?: string
}

type IdokladList<T> = {
  Items?: T[]
  TotalItems?: number
}

type IdokladCurrency = { Id: number; Code?: string }
type IdokladPaymentOption = { Id: number; IsDefault?: boolean | string }
type IdokladNumericSequence = {
  Id: number
  DocumentType?: number
  IsDefault?: boolean | string
  LastNumber?: string | number
}
type IdokladContact = {
  Id: number
  CompanyName?: string
  IdentificationNumber?: string
}
type IdokladReceivedInvoice = { Id: number; DocumentNumber?: string }

// VatRateType: 3=exempt(0%), 2=reduced(10%/12%), 1=standard(21%)
function mapDphSazba(sazba: number): number {
  if (sazba === 0) return 3
  if (sazba === 12 || sazba === 10) return 2
  return 1
}

function normalizeIdokladDate(value: string | null | undefined, fallback: string): string {
  const d = (value ?? '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : fallback
}

function buildIdokladDates(data: ExtractedInvoiceData): {
  issue: string
  maturity: string
  receiving: string
} {
  const today = new Date().toISOString().slice(0, 10)
  const issue = normalizeIdokladDate(data.datum_vystaveni, today)
  let maturity = normalizeIdokladDate(data.datum_splatnosti, issue)
  if (maturity < issue) maturity = issue
  return { issue, maturity, receiving: issue }
}

function isTruthyDefault(value: boolean | string | undefined): boolean {
  return value === true || value === 'true' || value === 'True'
}

function parseIdokladError(status: number, body: string): string {
  try {
    const json = JSON.parse(body) as IdokladApiEnvelope<unknown>
    if (json.Message) return `iDoklad API chyba ${status}: ${json.Message}`
  } catch {
    // raw text fallback
  }
  return `iDoklad API chyba ${status}: ${body.slice(0, 500)}`
}

async function idokladRequest<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${IDOKLAD_API_BASE}/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })

  const body = await res.text()
  if (!body) {
    if (!res.ok) throw new Error(`iDoklad API chyba ${res.status}`)
    return {} as T
  }

  let json: IdokladApiEnvelope<T>
  try {
    json = JSON.parse(body) as IdokladApiEnvelope<T>
  } catch {
    throw new Error(parseIdokladError(res.status, body))
  }

  if (!res.ok || json.IsSuccess === false) {
    throw new Error(parseIdokladError(res.status, json.Message ?? body))
  }

  return (json.Data ?? (json as unknown as T)) as T
}

async function idokladListItems<T>(token: string, resource: string, query = ''): Promise<T[]> {
  const path = query ? `${resource}?${query}` : resource
  const data = await idokladRequest<IdokladList<T>>(token, path, { method: 'GET' })
  return data.Items ?? []
}

/** Get an OAuth2 access token via client_credentials flow */
async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(IDOKLAD_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'idoklad_api',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`iDoklad token chyba ${res.status}: ${err}`)
  }
  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

async function resolveCurrencyId(token: string, mena: string): Promise<number> {
  const code = (mena || 'CZK').toUpperCase()
  const currencies = await idokladListItems<IdokladCurrency>(token, 'Currencies', 'pageSize=50')
  const match = currencies.find((c) => (c.Code ?? '').toUpperCase() === code)
  if (match?.Id) return match.Id
  if (code === 'CZK') return 1
  throw new Error(`iDoklad: měna ${code} není v účtu podporována`)
}

async function resolvePaymentOptionId(token: string): Promise<number> {
  const options = await idokladListItems<IdokladPaymentOption>(token, 'PaymentOptions', 'pageSize=50')
  const preferred = options.find((o) => isTruthyDefault(o.IsDefault))
  const id = preferred?.Id ?? options[0]?.Id
  if (!id) throw new Error('iDoklad: v účtu chybí platební metoda')
  return id
}

async function resolveNumericSequence(
  token: string
): Promise<{ id: number; nextSerial: string }> {
  const sequences = await idokladListItems<IdokladNumericSequence>(
    token,
    'NumericSequences',
    'pageSize=50'
  )

  const forReceived =
    sequences.find(
      (s) => s.DocumentType === RECEIVED_INVOICE_DOCUMENT_TYPE && isTruthyDefault(s.IsDefault)
    ) ??
    sequences.find((s) => s.DocumentType === RECEIVED_INVOICE_DOCUMENT_TYPE) ??
    sequences.find((s) => isTruthyDefault(s.IsDefault)) ??
    sequences[0]

  if (!forReceived?.Id) {
    throw new Error('iDoklad: v účtu chybí číselná řada pro přijaté faktury')
  }

  const last = parseInt(String(forReceived.LastNumber ?? '0'), 10)
  const nextSerial = String(Number.isFinite(last) && last >= 0 ? last + 1 : 1)
  return { id: forReceived.Id, nextSerial }
}

async function findContactByIco(token: string, ico: string): Promise<number | null> {
  const normalized = ico.replace(/\D/g, '')
  if (!normalized) return null

  for (let page = 1; page <= 5; page++) {
    const items = await idokladListItems<IdokladContact>(
      token,
      'Contacts',
      `page=${page}&pageSize=100`
    )
    if (!items.length) break

    const hit = items.find(
      (c) => String(c.IdentificationNumber ?? '').replace(/\D/g, '') === normalized
    )
    if (hit?.Id) return hit.Id
    if (items.length < 100) break
  }

  return null
}

async function resolvePartnerId(token: string, data: ExtractedInvoiceData): Promise<number> {
  const ico = (data.dodavatel_ico ?? '').replace(/\D/g, '')
  const existing = await findContactByIco(token, ico)
  if (existing) return existing

  const created = await idokladRequest<IdokladContact>(token, 'Contacts', {
    method: 'POST',
    body: JSON.stringify({
      CompanyName: data.dodavatel_nazev || 'Neznámý dodavatel',
      ...(ico ? { IdentificationNumber: ico } : {}),
      ...(data.dodavatel_dic ? { TaxIdentificationNumber: data.dodavatel_dic } : {}),
      CountryId: 1,
    }),
  })

  if (!created?.Id) {
    throw new Error('iDoklad: nepodařilo se vytvořit kontakt dodavatele')
  }

  return created.Id
}

export interface IdokladConnection {
  provider: 'idoklad'
  client_id: string | null
  client_secret: string
  api_key?: string
}

/**
 * Odeslání přijaté faktury do iDoklad API v3.
 * Účetní metadata: Items[].AccountingCode (náklad), Note (plná předkontace jako text).
 * iDoklad může vyžadovat ID z vlastní osnovy — AccountingCode jako string funguje u většiny účtů.
 */
export async function sendToIdoklad(
  connection: IdokladConnection,
  data: ExtractedInvoiceData
): Promise<{ id: string; documentNumber: string }> {
  let token: string
  if (connection.client_id) {
    token = await getAccessToken(connection.client_id, connection.client_secret)
  } else {
    token = connection.client_secret
  }

  const { issue, maturity, receiving } = buildIdokladDates(data)
  const unitPrice = Number(data.castka_bez_dph ?? data.castka_celkem ?? 0)
  const predkontace = buildPredkontaceFromExtracted(data)
  const itemName = (data.popis_plneni ?? `Faktura ${data.cislo_faktury ?? ''}`).slice(0, 200)

  const [partnerId, currencyId, paymentOptionId, numericSequence] = await Promise.all([
    resolvePartnerId(token, data),
    resolveCurrencyId(token, data.mena ?? 'CZK'),
    resolvePaymentOptionId(token),
    resolveNumericSequence(token),
  ])

  const payload = {
    PartnerId: partnerId,
    CurrencyId: currencyId,
    PaymentOptionId: paymentOptionId,
    NumericSequenceId: numericSequence.id,
    DocumentSerialNumber: numericSequence.nextSerial,
    IsIncomeTax: true,
    IsEet: false,
    DateOfIssue: issue,
    DateOfMaturity: maturity,
    DateOfReceiving: receiving,
    DateOfTaxing: issue,
    Description: data.popis_plneni ?? 'Přijatá faktura',
    ...(predkontace ? { Note: predkontace.comment } : {}),
    ...(data.variabilni_symbol ? { VariableSymbol: data.variabilni_symbol } : {}),
    ...(data.cislo_faktury ? { OrderNumber: data.cislo_faktury } : {}),
    Items: [
      {
        Name: itemName,
        Amount: 1,
        Unit: 'ks',
        UnitPrice: unitPrice,
        PriceType: PRICE_TYPE_WITHOUT_VAT,
        VatRateType: mapDphSazba(data.sazba_dph ?? 21),
        DiscountPercentage: 0,
        IsTaxMovement: false,
        ...(predkontace ? { AccountingCode: predkontace.naklad } : {}),
      },
    ],
  }

  const result = await idokladRequest<IdokladReceivedInvoice>(token, 'ReceivedInvoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!result?.Id) {
    throw new Error('iDoklad nevrátil ID vytvořené faktury')
  }

  return {
    id: String(result.Id),
    documentNumber: result.DocumentNumber ?? String(result.Id),
  }
}

/** Validate iDoklad credentials (client_credentials or legacy Bearer token) */
export async function validateIdokladConnection(
  clientId: string | null,
  clientSecret: string
): Promise<boolean> {
  try {
    let token: string
    if (clientId) {
      token = await getAccessToken(clientId, clientSecret)
    } else {
      token = clientSecret
    }
    const res = await fetch(`${IDOKLAD_API_BASE}/ReceivedInvoices?page=1&pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

/** @deprecated Use validateIdokladConnection */
export async function validateIdokladToken(apiKey: string): Promise<boolean> {
  return validateIdokladConnection(null, apiKey)
}
