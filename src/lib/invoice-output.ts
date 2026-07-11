import type { ExtractedInvoiceData, FakturaPolozka } from './claude'
import type { ProcessedInvoice } from '@/types/invoices'
import { parseBankPaymentFields, type ParsedBankPayment } from './bank-account'

export type InvoiceOutputLine = {
  nazev: string
  mnozstvi: number
  jednotka: string
  jednotkovaCena: number
  sazbaDph: number
  castkaBezDph: number
  ucetniKod?: string
  typ?: 'zbozi' | 'sluzba'
}

export type VatRecapEntry = {
  sazbaDph: number
  zaklad: number
  dph: number
}

export function roundInvoiceAmount(n: number): number {
  return Math.round(n * 100) / 100
}

function lineFromPolozka(p: FakturaPolozka, fallbackUcetniKod?: string): InvoiceOutputLine {
  const qty = p.mnozstvi > 0 ? p.mnozstvi : 1
  return {
    nazev: p.nazev.slice(0, 255),
    mnozstvi: qty,
    jednotka: (p.jednotka ?? 'ks').slice(0, 20),
    jednotkovaCena: p.jednotkova_cena,
    sazbaDph: p.sazba_dph ?? 21,
    castkaBezDph: roundInvoiceAmount(p.jednotkova_cena * qty),
    ucetniKod: p.ucetni_kod?.trim() || fallbackUcetniKod,
    typ: p.typ,
  }
}

/** Sjednocené položky faktury pro API i exporty */
export function buildInvoiceOutputLines(
  data: Pick<
    ExtractedInvoiceData,
    'polozky' | 'popis_plneni' | 'cislo_faktury' | 'castka_bez_dph' | 'castka_celkem' | 'sazba_dph' | 'ucetni_kod'
  >
): InvoiceOutputLine[] {
  const polozky = data.polozky?.filter((p) => p.nazev?.trim()) ?? []
  if (polozky.length > 0) {
    return polozky.map((p) => lineFromPolozka(p, data.ucetni_kod))
  }

  const base = Number(data.castka_bez_dph ?? data.castka_celkem ?? 0)
  return [
    {
      nazev: (data.popis_plneni ?? `Faktura ${data.cislo_faktury ?? ''}`).slice(0, 255),
      mnozstvi: 1,
      jednotka: 'ks',
      jednotkovaCena: base,
      sazbaDph: data.sazba_dph ?? 21,
      castkaBezDph: base,
      ucetniKod: data.ucetni_kod,
    },
  ]
}

export function buildInvoicePayment(
  data: Pick<ExtractedInvoiceData, 'cislo_uctu' | 'kod_banky' | 'iban' | 'swift'>
): ParsedBankPayment {
  return parseBankPaymentFields(data)
}

/** Nejlepší řetězec bankovního účtu pro export (IBAN nebo číslo/kód banky) */
export function formatPaymentAccount(payment: ParsedBankPayment): string | null {
  if (payment.iban) return payment.iban
  if (payment.accountNumber && payment.bankCode) {
    return `${payment.accountNumber}/${payment.bankCode}`
  }
  return payment.accountNumber
}

export function buildVatRecap(lines: InvoiceOutputLine[]): VatRecapEntry[] {
  const map = new Map<number, number>()
  for (const line of lines) {
    map.set(line.sazbaDph, (map.get(line.sazbaDph) ?? 0) + line.castkaBezDph)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([sazbaDph, zaklad]) => ({
      sazbaDph,
      zaklad: roundInvoiceAmount(zaklad),
      dph: roundInvoiceAmount((zaklad * sazbaDph) / 100),
    }))
}

export function buildExtractedDataFromInvoice(inv: ProcessedInvoice): ExtractedInvoiceData {
  const raw = (inv.raw_extraction ?? {}) as Record<string, unknown>

  return {
    dodavatel_nazev: inv.dodavatel_nazev ?? '',
    dodavatel_ico: inv.dodavatel_ico ?? '',
    dodavatel_dic: inv.dodavatel_dic,
    cislo_faktury: inv.cislo_faktury ?? '',
    datum_vystaveni: inv.datum_vystaveni ?? new Date().toISOString().slice(0, 10),
    datum_splatnosti: inv.datum_splatnosti ?? new Date().toISOString().slice(0, 10),
    variabilni_symbol: inv.variabilni_symbol ?? '',
    castka_bez_dph: Number(inv.castka_bez_dph ?? 0),
    sazba_dph: inv.sazba_dph ?? 21,
    castka_dph: Number(inv.castka_dph ?? 0),
    castka_celkem: Number(inv.castka_celkem ?? 0),
    mena: inv.mena ?? 'CZK',
    popis_plneni: inv.popis_plneni ?? '',
    cislo_uctu: (raw.cislo_uctu as string | null | undefined) ?? null,
    kod_banky: (raw.kod_banky as string | null | undefined) ?? null,
    iban: inv.iban,
    swift: (raw.swift as string | null | undefined) ?? null,
    konstantni_symbol: (raw.konstantni_symbol as string | null | undefined) ?? null,
    cislo_objednavky: (raw.cislo_objednavky as string | null | undefined) ?? null,
    ucetni_kod: inv.ucetni_kod ?? '518',
    ucetni_kod_nazev: inv.ucetni_kod_nazev ?? 'Ostatní služby',
    ucetni_kod_duvod: inv.ucetni_kod_duvod ?? '',
    ucetni_kod_confidence: inv.ucetni_kod_confidence ?? 0,
    confidence: inv.confidence ?? 0,
    problemy: inv.problemy ?? [],
    typ_dokladu: (raw.typ_dokladu as ExtractedInvoiceData['typ_dokladu']) ?? 'faktura',
    typ_faktury: (raw.typ_faktury as ExtractedInvoiceData['typ_faktury']) ?? 'danovy_doklad',
    castka_k_uhrade:
      raw.castka_k_uhrade != null ? Number(raw.castka_k_uhrade) : undefined,
    datum_duzp: (raw.datum_duzp as string | null | undefined) ?? null,
    je_prenesena_dan: Boolean(raw.je_prenesena_dan),
    polozky: (raw.polozky as ExtractedInvoiceData['polozky']) ?? [],
  }
}
