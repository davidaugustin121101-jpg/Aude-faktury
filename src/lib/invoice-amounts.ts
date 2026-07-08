import type { ExtractedInvoiceData } from './claude'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function lineBase(p: { mnozstvi: number; jednotkova_cena: number }): number {
  return round2(Number(p.mnozstvi) * Number(p.jednotkova_cena))
}

function lineVat(base: number, rate: number): number {
  return round2(base * (rate / 100))
}

/** Součet z položek, pokud hlavička má 0 Kč (vyúčtování zálohy). */
export function sumAmountsFromPolozky(data: ExtractedInvoiceData): {
  castka_bez_dph: number
  castka_dph: number
  castka_celkem: number
} | null {
  const polozky = data.polozky?.filter((p) => p.nazev?.trim()) ?? []
  if (polozky.length === 0) return null

  let base = 0
  let vat = 0
  for (const p of polozky) {
    const b = lineBase(p)
    const rate = p.sazba_dph ?? data.sazba_dph ?? 21
    base += b
    vat += lineVat(b, rate)
  }

  base = round2(base)
  vat = round2(vat)
  const total = round2(base + vat)
  if (total <= 0) return null

  return { castka_bez_dph: base, castka_dph: vat, castka_celkem: total }
}

/**
 * Doplní hlavičkové částky z položek, když jde o daňový doklad po záloze (doplatek 0 Kč).
 */
export function reconcileExtractionAmounts(data: ExtractedInvoiceData): ExtractedInvoiceData {
  const headerTotal = round2(Number(data.castka_celkem ?? 0))
  const kUhrade = data.castka_k_uhrade != null ? round2(Number(data.castka_k_uhrade)) : null
  const isAdvanceSettlement =
    data.typ_faktury === 'danovy_doklad' &&
    (headerTotal < 0.01 || (kUhrade != null && kUhrade < 0.01))

  if (!isAdvanceSettlement) return data

  const fromPolozky = sumAmountsFromPolozky(data)
  if (!fromPolozky) return data

  const note =
    headerTotal < 0.01
      ? 'Hlavička uvádí 0 Kč k úhradě — částky doplněny z rozpisu položek (vyúčtování zálohy).'
      : null

  return {
    ...data,
    castka_bez_dph: fromPolozky.castka_bez_dph,
    castka_dph: fromPolozky.castka_dph,
    castka_celkem: fromPolozky.castka_celkem,
    castka_k_uhrade: kUhrade ?? 0,
    problemy: note ? [...(data.problemy ?? []), note] : data.problemy,
    confidence: Math.min(0.95, (data.confidence ?? 0.85) + 0.05),
  }
}

export function isZalohovaTyp(data: {
  typ_faktury?: string | null
  typ_dokladu?: string | null
}): boolean {
  if (data.typ_faktury === 'zalohova') return true
  if (data.typ_dokladu === 'proforma') return true
  return false
}

export function effectiveAmountForPairing(data: {
  castka_celkem?: number | null
  castka_k_uhrade?: number | null
  typ_faktury?: string | null
  polozky?: ExtractedInvoiceData['polozky']
  castka_bez_dph?: number | null
  castka_dph?: number | null
}): number | null {
  const total = data.castka_celkem != null ? round2(Number(data.castka_celkem)) : null
  if (total != null && total > 0.01) return total

  const fromPolozky = sumAmountsFromPolozky(data as ExtractedInvoiceData)
  if (fromPolozky) return fromPolozky.castka_celkem

  const base = data.castka_bez_dph != null ? round2(Number(data.castka_bez_dph)) : 0
  const vat = data.castka_dph != null ? round2(Number(data.castka_dph)) : 0
  const sum = round2(base + vat)
  return sum > 0.01 ? sum : null
}
