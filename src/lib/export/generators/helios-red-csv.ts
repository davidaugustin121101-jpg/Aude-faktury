import iconv from 'iconv-lite'
import type { ExportProfile, NormalizedInvoice } from '../types'
import { breakdownVatForHelios } from '../vat-mapping'
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
  const vat = breakdownVatForHelios(
    inv.castkaBezDph,
    inv.castkaDph,
    inv.castkaCelkem,
    inv.sazbaDph
  )

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

  const prifakRow = [
    1,
    formatDateHelios(inv.datumVystaveni),
    formatDateHelios(inv.datumVystaveni),
    inv.cisloFaktury,
    inv.variabilniSymbol ?? inv.cisloFaktury,
    0,
    inv.dodavatelNazev.slice(0, 200),
    formatMoney(inv.castkaCelkem),
    formatMoney(vat.base0),
    formatMoney(vat.base0),
    formatMoney(vat.vat12),
    formatMoney(vat.base12),
    formatMoney(vat.vat21),
    formatMoney(vat.base21),
    'FP',
    formatDateHelios(inv.datumSplatnosti),
    inv.dodavatelIco,
    inv.predkontace?.comment ?? inv.popisPlneni.slice(0, 200),
    profile?.costCenter ?? '',
    profile?.contractCode ?? '',
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

  const primaryRate = inv.sazbaDph === 0 ? 0 : inv.sazbaDph === 12 || inv.sazbaDph === 10 ? inv.sazbaDph : 21

  const pripolRow = [
    1,
    formatDateHelios(inv.datumVystaveni),
    'FP',
    inv.dodavatelNazev.slice(0, 200),
    formatMoney(inv.castkaCelkem),
    0,
    formatMoney(inv.castkaBezDph),
    primaryRate,
    formatMoney(inv.castkaDph),
    '.F.',
  ]

  const prifak = [csvRow(prifakHeader), csvRow(prifakRow)].join('\r\n')
  const pripol = [csvRow(pripolHeader), csvRow(pripolRow)].join('\r\n')

  return { prifak, pripol }
}

/** Windows-1250 encoding pro Helios Red */
export function encodeHeliosCsv(content: string): Buffer {
  return iconv.encode(content, 'win1250')
}
