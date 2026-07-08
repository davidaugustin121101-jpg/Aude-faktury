import type { ExtractedInvoiceData } from './claude'
import type { Predkontace } from './predkontace'
import { buildPredkontace, predkontaceConfigForExtracted } from './predkontace'

export type PolozkaTyp = 'zbozi' | 'sluzba'

export type FakturaPolozka = {
  nazev: string
  mnozstvi: number
  jednotkova_cena: number
  sazba_dph: number
  typ: PolozkaTyp
  ucetni_kod?: string
  ucetni_kod_nazev?: string
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function lineBase(p: FakturaPolozka): number {
  return round2(Number(p.mnozstvi) * Number(p.jednotkova_cena))
}

function lineVat(base: number, rate: number): number {
  return round2(base * (rate / 100))
}

/** Navrhne účetní kód podle typu a názvu položky */
export function suggestUcetniKodForPolozka(polozka: FakturaPolozka): {
  kod: string
  nazev: string
} {
  if (polozka.ucetni_kod?.trim()) {
    return {
      kod: polozka.ucetni_kod.trim(),
      nazev: polozka.ucetni_kod_nazev?.trim() || 'Položka faktury',
    }
  }

  const name = polozka.nazev.toLowerCase()
  const lineTotal = lineBase(polozka)

  if (polozka.typ === 'zbozi') {
    if (lineTotal >= 80_000 && /hardware|server|notebook|počítač|pc\b|tiskárna/.test(name)) {
      return { kod: '022', nazev: 'Pořízení DHM' }
    }
    if (/materiál|zboží|sklad|komponent/.test(name)) {
      return { kod: '504', nazev: 'Spotřeba materiálu' }
    }
    return { kod: '501', nazev: 'Spotřeba materiálu' }
  }

  if (lineTotal >= 60_000 && /software|licence|license/.test(name)) {
    return { kod: '013', nazev: 'Pořízení NMA' }
  }
  if (/energie|elektř|plyn|voda|topn/.test(name)) return { kod: '502', nazev: 'Spotřeba energie' }
  if (/oprav|servis/.test(name)) return { kod: '511', nazev: 'Opravy a udržba' }
  if (/doprav|přeprav|kurýr|pošt/.test(name)) return { kod: '518', nazev: 'Doprava' }
  if (/reklam|marketing|google ads|meta ads/.test(name)) return { kod: '518', nazev: 'Reklama a marketing' }

  return { kod: '518', nazev: 'Ostatní služby' }
}

export function applyPolozkyToExtraction(data: ExtractedInvoiceData): ExtractedInvoiceData {
  const polozky = data.polozky?.filter((p) => p.nazev?.trim()) ?? []
  if (polozky.length === 0) return data

  const enriched = polozky.map((p) => {
    const suggestion = suggestUcetniKodForPolozka(p)
    return {
      ...p,
      ucetni_kod: p.ucetni_kod ?? suggestion.kod,
      ucetni_kod_nazev: p.ucetni_kod_nazev ?? suggestion.nazev,
    }
  })

  const types = new Set(enriched.map((p) => p.typ))
  const codes = new Set(enriched.map((p) => suggestUcetniKodForPolozka(p).kod))

  if (types.size === 1 && codes.size === 1) {
    const first = enriched[0]
    const suggestion = suggestUcetniKodForPolozka(first)
    return {
      ...data,
      polozky: enriched,
      ucetni_kod: suggestion.kod,
      ucetni_kod_nazev: suggestion.nazev,
      ucetni_kod_duvod: `Účetní kód z položek faktury (${enriched.length}× ${first.typ}). ${data.ucetni_kod_duvod}`,
      ucetni_kod_confidence: Math.max(data.ucetni_kod_confidence, 0.88),
    }
  }

  const summary = [...codes].join(', ')
  return {
    ...data,
    polozky: enriched,
    ucetni_kod: enriched[0] ? suggestUcetniKodForPolozka(enriched[0]).kod : data.ucetni_kod,
    ucetni_kod_nazev: 'Smíšené položky',
    ucetni_kod_duvod: `Faktura obsahuje smíšené položky — navrženo rozdělení předkontace (${summary}). ${data.ucetni_kod_duvod}`,
    ucetni_kod_confidence: Math.max(data.ucetni_kod_confidence, 0.75),
  }
}

export type SplitPredkontaceGroup = {
  label: string
  ucetniKod: string
  polozky: FakturaPolozka[]
  predkontace: Predkontace
}

/** Rozdělená předkontace pro smíšené položky (zboží + služba) */
export function buildSplitPredkontaceFromExtracted(
  data: ExtractedInvoiceData,
  jePrenesenaDan = false
): SplitPredkontaceGroup[] | null {
  const polozky = data.polozky?.filter((p) => p.nazev?.trim()) ?? []
  if (polozky.length === 0) return null

  const groups = new Map<string, FakturaPolozka[]>()

  for (const p of polozky) {
    const { kod } = suggestUcetniKodForPolozka(p)
    const key = kod
    const list = groups.get(key) ?? []
    list.push(p)
    groups.set(key, list)
  }

  if (groups.size <= 1 && polozky.length <= 1) return null

  const mena = data.mena ?? 'CZK'
  const result: SplitPredkontaceGroup[] = []

  for (const [kod, items] of groups) {
    let base = 0
    let vat = 0
    for (const item of items) {
      const b = lineBase(item)
      const rate = item.sazba_dph ?? data.sazba_dph ?? 21
      base += b
      vat += lineVat(b, rate)
    }
    base = round2(base)
    vat = round2(vat)
    const total = round2(base + vat)

    const predkontace = buildPredkontace(
      {
        ucetni_kod: kod,
        castka_bez_dph: base,
        castka_dph: vat,
        castka_celkem: total,
        mena,
        je_prenesena_dan: jePrenesenaDan,
      },
      predkontaceConfigForExtracted(data)
    )

    if (!predkontace) continue

    result.push({
      label: items.map((i) => i.nazev).join(', ').slice(0, 80),
      ucetniKod: kod,
      polozky: items,
      predkontace,
    })
  }

  return result.length > 1 ? result : null
}
