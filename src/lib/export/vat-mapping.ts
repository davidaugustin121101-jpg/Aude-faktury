import type { CountryCode, PohodaRateVat } from './types'

/** Pohoda rateVAT enum dle sazby a země */
export function mapPohodaRateVat(rate: number, country: CountryCode): PohodaRateVat {
  if (rate === 0) return 'none'
  if (country === 'sk') {
    if (rate === 20) return 'high'
    if (rate === 10) return 'low'
    return 'high'
  }
  if (rate === 21) return 'high'
  if (rate === 12 || rate === 10) return 'low'
  return 'high'
}

export type VatBreakdown = {
  base0: number
  vat0: number
  base12: number
  vat12: number
  base21: number
  vat21: number
}

/** Rozdělení DPH pro Helios Red CSV sloupce */
export function breakdownVatForHelios(
  base: number,
  vat: number,
  total: number,
  rate: number
): VatBreakdown {
  const result: VatBreakdown = {
    base0: 0,
    vat0: 0,
    base12: 0,
    vat12: 0,
    base21: 0,
    vat21: 0,
  }

  if (rate === 0) {
    result.base0 = base
    result.vat0 = 0
  } else if (rate === 12 || rate === 10) {
    result.base12 = base
    result.vat12 = vat
  } else {
    result.base21 = base
    result.vat21 = vat
  }

  void total
  return result
}
