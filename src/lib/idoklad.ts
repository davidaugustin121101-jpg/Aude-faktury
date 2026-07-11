import type { ExtractedInvoiceData } from './claude'
import { buildPredkontaceFromExtracted } from './predkontace'
import type { InvoicePdfAttachment } from './invoice-pdf-storage'
import { lookupAres } from './invoice-audit/rules/ares-lookup'
import {
  buildIdokladContactPayload,
  contactNeedsAddressSync,
} from './idoklad-contact'
import { buildInvoiceOutputLines, buildInvoicePayment } from './invoice-output'
import { normalizeBankCode } from './bank-account'

const IDOKLAD_API_BASE = 'https://api.idoklad.cz/v3'
const IDOKLAD_TOKEN_URL = 'https://app.idoklad.cz/identity/server/connect/token'

/** NumericSequence.DocumentType pro přijaté faktury (jiný enum než Attachments) */
const RECEIVED_INVOICE_NUMERIC_SEQUENCE_TYPE = 1

/** DocumentType enum pro Attachments API – ReceivedInvoice = 5 */
export const IDOKLAD_ATTACHMENT_RECEIVED_INVOICE_TYPE = 5

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
  Street?: string | null
  City?: string | null
  PostalCode?: string | null
  CountryId?: number | null
}
type IdokladBank = { Id: number; Code?: string; NumberCode?: string; Name?: string; Swift?: string }
type IdokladReceivedInvoice = { Id: number; DocumentNumber?: string }

export type IdokladInvoiceItemPayload = {
  Name: string
  Amount: number
  Unit: string
  UnitPrice: number
  PriceType: number
  VatRateType: number
  CustomVatRate: number
  VatCodeId?: number
}

/** iDoklad VatRateType: 0=Reduced1 (10%), 1=Basic (21%), 2=Zero, 3=Reduced2 (12%) */
export function mapIdokladVatRateType(sazbaDph: number): number {
  const rate = Math.round(sazbaDph)
  if (rate === 0) return 2
  if (rate === 10) return 0
  if (rate === 12) return 3
  return 1
}

/** Položky faktury pro iDoklad — z tabulky polozky[], jinak jedna agregovaná položka */
export function buildIdokladItems(
  data: ExtractedInvoiceData,
  options?: { vatCodeId?: number | null }
): IdokladInvoiceItemPayload[] {
  const lines = buildInvoiceOutputLines(data)

  return lines.map((line) => ({
    Name: line.nazev.slice(0, 200),
    Amount: line.mnozstvi,
    Unit: line.jednotka,
    UnitPrice: line.jednotkovaCena,
    PriceType: PRICE_TYPE_WITHOUT_VAT,
    VatRateType: mapIdokladVatRateType(line.sazbaDph),
    CustomVatRate: line.sazbaDph,
    ...(options?.vatCodeId ? { VatCodeId: options.vatCodeId } : {}),
  }))
}

function buildIdokladTaxingDate(data: ExtractedInvoiceData, issue: string): string {
  return normalizeIdokladDate(data.datum_duzp, issue)
}

export function buildIdokladBankFields(data: ExtractedInvoiceData): Record<string, string | number> {
  const bank = buildInvoicePayment(data)

  const out: Record<string, string | number> = {}
  if (bank.accountNumber) out.AccountNumber = bank.accountNumber
  if (bank.iban) out.Iban = bank.iban
  if (bank.swift) out.Swift = bank.swift
  if (bank.bankCode) out._bankCode = bank.bankCode
  return out
}

type IdokladVatCode = { Id: number; VatMovementType?: number; Name?: string; Code?: string }

/** Kód DPH pro přijaté faktury (vstupní DPH) */
const IDOKLAD_VAT_MOVEMENT_ENTRY = 1

async function resolvePurchaseVatCodeId(token: string): Promise<number | null> {
  const codes = await idokladListAllItems<IdokladVatCode>(token, 'VatCodes')
  const purchase =
    codes.find((code) => code.VatMovementType === IDOKLAD_VAT_MOVEMENT_ENTRY) ?? codes[0]
  return purchase?.Id ?? null
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

async function idokladListAllItems<T>(
  token: string,
  resource: string,
  pageSize = 100
): Promise<T[]> {
  const all: T[] = []
  for (let page = 1; page <= 10; page++) {
    const items = await idokladListItems<T>(token, resource, `page=${page}&pageSize=${pageSize}`)
    if (!items.length) break
    all.push(...items)
    if (items.length < pageSize) break
  }
  return all
}

export function matchIdokladBankByCode(bank: IdokladBank, bankCode: string): boolean {
  const target = normalizeBankCode(bankCode)
  if (!target) return false

  const candidates = [bank.NumberCode, bank.Code]
  return candidates.some((value) => normalizeBankCode(value) === target)
}

async function resolveBankId(token: string, bankCode: string | null | undefined): Promise<number | null> {
  const code = normalizeBankCode(bankCode)
  if (!code) return null

  const banks = await idokladListAllItems<IdokladBank>(token, 'Banks')
  const hit = banks.find((bank) => matchIdokladBankByCode(bank, code))
  if (!hit?.Id) {
    console.warn(`[idoklad] BankId nenalezeno pro kód ${code} (načteno ${banks.length} bank)`)
  }
  return hit?.Id ?? null
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
      (s) => s.DocumentType === RECEIVED_INVOICE_NUMERIC_SEQUENCE_TYPE && isTruthyDefault(s.IsDefault)
    ) ??
    sequences.find((s) => s.DocumentType === RECEIVED_INVOICE_NUMERIC_SEQUENCE_TYPE) ??
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

async function resolvePartnerId(
  token: string,
  data: ExtractedInvoiceData
): Promise<number> {
  const ico = (data.dodavatel_ico ?? '').replace(/\D/g, '')
  const existingId = await findContactByIco(token, ico)
  const ares = ico ? await lookupAres(ico).catch(() => null) : null

  const bankFields = buildIdokladBankFields(data)
  const bankCode = bankFields._bankCode as string | undefined
  delete bankFields._bankCode
  const bankId = bankCode ? await resolveBankId(token, bankCode) : null

  const contactPayload = buildIdokladContactPayload(data, {
    ares,
    bankId,
    bankFields,
  })

  if (existingId) {
    try {
      const existing = await idokladRequest<IdokladContact>(token, `Contacts/${existingId}`, {
        method: 'GET',
      })
      if (contactNeedsAddressSync(existing)) {
        await idokladRequest<IdokladContact>(token, 'Contacts', {
          method: 'PATCH',
          body: JSON.stringify({ Id: existingId, ...contactPayload }),
        })
      }
    } catch (err) {
      console.error('[idoklad] sync kontaktu dodavatele selhal:', err)
    }
    return existingId
  }

  const created = await idokladRequest<IdokladContact>(token, 'Contacts', {
    method: 'POST',
    body: JSON.stringify(contactPayload),
  })

  if (!created?.Id) {
    throw new Error('iDoklad: nepodařilo se vytvořit kontakt dodavatele')
  }

  return created.Id
}

export function buildIdokladAttachmentPath(documentId: number): string {
  return `Attachments/${documentId}/${IDOKLAD_ATTACHMENT_RECEIVED_INVOICE_TYPE}`
}

async function uploadIdokladAttachment(
  token: string,
  documentId: number,
  pdf: InvoicePdfAttachment
): Promise<void> {
  const path = buildIdokladAttachmentPath(documentId)
  const attempts: Array<{ method: 'PUT' | 'POST'; label: string }> = [
    { method: 'PUT', label: 'PUT FileBytes' },
    { method: 'POST', label: 'POST FileBytes' },
  ]

  let lastError = 'Neznámá chyba uploadu přílohy'

  for (const attempt of attempts) {
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(pdf.bytes)], { type: 'application/pdf' })
    formData.append('FileBytes', blob, pdf.filename)

    const res = await fetch(`${IDOKLAD_API_BASE}/${path}`, {
      method: attempt.method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const body = await res.text()
    if (res.ok) return

    lastError = parseIdokladError(res.status, body)
    console.error(`[idoklad] ${attempt.label} selhal:`, lastError)
  }

  throw new Error(lastError)
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
  data: ExtractedInvoiceData,
  pdf?: InvoicePdfAttachment | null
): Promise<{ id: string; documentNumber: string; pdfAttached: boolean; pdfAttachmentError?: string }> {
  let token: string
  if (connection.client_id) {
    token = await getAccessToken(connection.client_id, connection.client_secret)
  } else {
    token = connection.client_secret
  }

  const { issue, maturity, receiving } = buildIdokladDates(data)
  const predkontace = buildPredkontaceFromExtracted(data)
  const taxingDate = buildIdokladTaxingDate(data, issue)

  const bankFields = buildIdokladBankFields(data)
  const bankCode = bankFields._bankCode as string | undefined
  delete bankFields._bankCode

  const [partnerId, currencyId, paymentOptionId, numericSequence, bankId, vatCodeId] =
    await Promise.all([
    resolvePartnerId(token, data),
    resolveCurrencyId(token, data.mena ?? 'CZK'),
    resolvePaymentOptionId(token),
    resolveNumericSequence(token),
    bankCode ? resolveBankId(token, bankCode) : Promise.resolve(null),
    resolvePurchaseVatCodeId(token),
  ])

  const items = buildIdokladItems(data, { vatCodeId })
  const documentSerialNumber = parseInt(numericSequence.nextSerial, 10)

  const payload = {
    PartnerId: partnerId,
    CurrencyId: currencyId,
    PaymentOptionId: paymentOptionId,
    DocumentSerialNumber: Number.isFinite(documentSerialNumber) ? documentSerialNumber : 1,
    IsIncomeTax: true,
    DateOfIssue: issue,
    DateOfMaturity: maturity,
    DateOfReceiving: receiving,
    DateOfTaxing: taxingDate,
    DateOfVatApplication: taxingDate,
    Description: data.popis_plneni ?? 'Přijatá faktura',
    ...(predkontace ? { Note: predkontace.comment } : {}),
    ...(data.variabilni_symbol ? { VariableSymbol: data.variabilni_symbol } : {}),
    ...(data.konstantni_symbol ? { ConstantSymbol: data.konstantni_symbol } : {}),
    ...(data.cislo_objednavky ? { OrderNumber: data.cislo_objednavky } : {}),
    ...(data.cislo_faktury ? { ReceivedDocumentNumber: data.cislo_faktury } : {}),
    ...(bankFields.AccountNumber ? { AccountNumber: bankFields.AccountNumber } : {}),
    ...(bankId ? { BankId: bankId } : {}),
    ...(bankFields.Iban ? { Iban: bankFields.Iban } : {}),
    ...(bankFields.Swift ? { Swift: bankFields.Swift } : {}),
    Items: items,
  }

  const result = await idokladRequest<IdokladReceivedInvoice>(token, 'ReceivedInvoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!result?.Id) {
    throw new Error('iDoklad nevrátil ID vytvořené faktury')
  }

  let pdfAttached = false
  let pdfAttachmentError: string | undefined
  if (pdf) {
    try {
      await uploadIdokladAttachment(token, result.Id, pdf)
      pdfAttached = true
    } catch (err) {
      pdfAttachmentError = err instanceof Error ? err.message : 'Upload PDF přílohy selhal'
      console.error('[idoklad] PDF příloha se nepodařila nahrát:', pdfAttachmentError)
    }
  }

  return {
    id: String(result.Id),
    documentNumber: result.DocumentNumber ?? String(result.Id),
    pdfAttached,
    pdfAttachmentError,
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
