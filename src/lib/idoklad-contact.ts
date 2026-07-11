import type { ExtractedInvoiceData } from './claude'
import type { AresSubject } from './invoice-audit/rules/ares-lookup'
import { parseBankPaymentFields } from './bank-account'

/** iDoklad Countries list – 1 = Slovensko, 2 = Česko */
export const IDOKLAD_COUNTRY_SK = 1
export const IDOKLAD_COUNTRY_CZ = 2

export function inferIdokladCountryId(
  data: Pick<ExtractedInvoiceData, 'dodavatel_dic'>,
  aresCountryCode?: string | null
): number {
  const dic = (data.dodavatel_dic ?? '').trim().toUpperCase()
  if (dic.startsWith('SK')) return IDOKLAD_COUNTRY_SK
  if (dic.startsWith('CZ')) return IDOKLAD_COUNTRY_CZ

  const ares = (aresCountryCode ?? '').trim().toUpperCase()
  if (ares === 'SK') return IDOKLAD_COUNTRY_SK
  if (ares === 'CZ') return IDOKLAD_COUNTRY_CZ

  return IDOKLAD_COUNTRY_CZ
}

export function buildStreetFromAresSidlo(sidlo: NonNullable<AresSubject['sidlo']>): string | undefined {
  if (sidlo.textovaAdresa?.trim()) {
    const firstPart = sidlo.textovaAdresa.split(',')[0]?.trim()
    if (firstPart) return firstPart
  }

  const parts: string[] = []
  if (sidlo.nazevUlice?.trim()) parts.push(sidlo.nazevUlice.trim())
  if (sidlo.cisloDomovni != null) {
    let house = String(sidlo.cisloDomovni)
    if (sidlo.cisloOrientacni != null) {
      house += `/${sidlo.cisloOrientacni}`
      if (sidlo.cisloOrientacniPismeno) house += sidlo.cisloOrientacniPismeno
    }
    parts.push(house)
  }

  const street = parts.join(' ').trim()
  return street || undefined
}

export function buildIdokladContactPayload(
  data: ExtractedInvoiceData,
  options?: {
    ares?: AresSubject | null
    bankId?: number | null
    bankFields?: Record<string, string | number>
  }
): Record<string, string | number> {
  const ico = (data.dodavatel_ico ?? '').replace(/\D/g, '')
  const sidlo = options?.ares?.sidlo
  const countryId = inferIdokladCountryId(data, sidlo?.kodStatu ?? null)

  const payload: Record<string, string | number> = {
    CompanyName: data.dodavatel_nazev || 'Neznámý dodavatel',
    CountryId: countryId,
  }

  if (ico) payload.IdentificationNumber = ico
  if (data.dodavatel_dic?.trim()) payload.TaxIdentificationNumber = data.dodavatel_dic.trim()

  const bank =
    options?.bankFields ??
    (() => {
      const parsed = parseBankPaymentFields(data)
      const out: Record<string, string | number> = {}
      if (parsed.accountNumber) out.AccountNumber = parsed.accountNumber
      if (parsed.iban) out.Iban = parsed.iban
      if (parsed.swift) out.Swift = parsed.swift
      return out
    })()

  if (bank.AccountNumber) payload.AccountNumber = bank.AccountNumber
  if (bank.Iban) payload.Iban = bank.Iban
  if (bank.Swift) payload.Swift = bank.Swift
  if (options?.bankId) payload.BankId = options.bankId

  if (sidlo) {
    const street = buildStreetFromAresSidlo(sidlo)
    const city = sidlo.nazevObce?.trim()
    const postalCode = sidlo.psc != null ? String(sidlo.psc) : undefined
    if (street) payload.Street = street
    if (city) payload.City = city
    if (postalCode) payload.PostalCode = postalCode
  }

  return payload
}

export function contactNeedsAddressSync(contact: {
  Street?: string | null
  City?: string | null
  PostalCode?: string | null
  CountryId?: number | null
}): boolean {
  const hasStreet = Boolean(contact.Street?.trim())
  const hasCity = Boolean(contact.City?.trim())
  const wrongCountry = contact.CountryId === IDOKLAD_COUNTRY_SK && !hasStreet && !hasCity
  return !hasStreet || !hasCity || wrongCountry
}
