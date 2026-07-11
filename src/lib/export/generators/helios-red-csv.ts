import iconv from 'iconv-lite'
import type { ExportProfile, NormalizedInvoice } from '../types'
import { buildVatRecap } from '@/lib/invoice-output'
import { formatDateHelios, formatMoney } from '../xml-utils'

function csvEscape(value: string | number): string {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csvRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(',')
}

export type HeliosRedCsvFiles = {
  prifak: string
  pripol: string
}

export function generateHeliosRedCsv(
  inv: NormalizedInvoice,
  profile?: ExportProfile
): HeliosRedCsvFiles {
  const recap = buildVatRecap(
    inv.polozky.map((line) => ({
      nazev: line.nazev,
      mnozstvi: line.mnozstvi,
      jednotka: line.jednotka,
      jednotkovaCena: line.jednotkovaCena,
      sazbaDph: line.sazbaDph,
      castkaBezDph: line.castkaBezDph,
    }))
  )

  const base0 = recap.find((r) => r.sazbaDph === 0)?.zaklad ?? 0
  const base12 = recap.find((r) => r.sazbaDph === 12 || r.sazbaDph === 10)?.zaklad ?? 0
  const vat12 = recap.find((r) => r.sazbaDph === 12 || r.sazbaDph === 10)?.dph ?? 0
  const base21 = recap
    .filter((r) => r.sazbaDph !== 0 && r.sazbaDph !== 12 && r.sazbaDph !== 10)
    .reduce((sum, r) => sum + r.zaklad, 0)
  const vat21 = recap
    .filter((r) => r.sazbaDph !== 0 && r.sazbaDph !== 12 && r.sazbaDph !== 10)
    .reduce((sum, r) => sum + r.dph, 0)

  const noteParts = [
    inv.predkontace?.comment ?? inv.popisPlneni.slice(0, 200),
    inv.paymentAccount ? `Účet: ${inv.paymentAccount}` : null,
    inv.konstantniSymbol ? `KS: ${inv.konstantniSymbol}` : null,
    inv.cisloObjednavky ? `Obj: ${inv.cisloObjednavky}` : null,
  ].filter(Boolean)

  const prifakRow = [
    1,
    formatDateHelios(inv.datumDuzp ?? inv.datumVystaveni),
    formatDateHelios(inv.datumVystaveni),
    inv.cisloFaktury,
    inv.variabilniSymbol ?? inv.cisloFaktury,
    0,
    inv.dodavatelNazev.slice(0, 200),
    formatMoney(inv.castkaCelkem),
    formatMoney(base0),
    formatMoney(base0),
    formatMoney(vat12),
    formatMoney(base12),
    formatMoney(vat21),
    formatMoney(base21),
    'FP',
    formatDateHelios(inv.datumSplatnosti),
    inv.dodavatelIco,
    String(noteParts.join(' | ')).slice(0, 200),
    profile?.costCenter ?? '',
    profile?.contractCode ?? '',
  ]

  const prifakHeader = [
    'CISLO',
    'DATUM',
    'DATUM2',
    'DOKLAD',
    'DOKLAD2',
    'CIS',
    'TEXT',
    'KCS',
    'ZN',
    'Z0',
    'Z5',
    'D5',
    'Z23',
    'D23',
    'DRUH',
    'DATSPL',
    'DOD_ICO',
    'POZNAMKA',
    'STRED',
    'STRED2',
  ]

  const pripolHeader = [
    'P_CISLO',
    'P_TYP',
    'P_DRUH',
    'P_TEXT',
    'P_CELKEM',
    'P_CM',
    'P_ZAKLAD',
    'P_PROCENTO',
    'P_DAN',
    'P_MAJETEK',
  ]

  const pripolRows = inv.polozky.map((line, index) => {
    const vat = (line.castkaBezDph * line.sazbaDph) / 100
    const total = line.castkaBezDph + vat
    return [
      index + 1,
      formatDateHelios(inv.datumDuzp ?? inv.datumVystaveni),
      'FP',
      line.nazev.slice(0, 200),
      formatMoney(total),
      0,
      formatMoney(line.castkaBezDph),
      line.sazbaDph,
      formatMoney(vat),
      '.F.',
    ]
  })

  const prifak = [csvRow(prifakHeader), csvRow(prifakRow)].join('\r\n')
  const pripol = [csvRow(pripolHeader), ...pripolRows.map((row) => csvRow(row))].join('\r\n')

  return { prifak, pripol }
}

/** Windows-1250 encoding pro Helios Red */
export function encodeHeliosCsv(content: string): Buffer {
  return iconv.encode(content, 'win1250')
}
