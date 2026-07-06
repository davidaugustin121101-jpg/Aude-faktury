import type { Predkontace } from '@/lib/predkontace'
import type { ProcessedInvoice } from '@/types/invoices'
import type { AuditResult } from '@/lib/invoice-audit/types'

export type ExportFormat =
  | 'isdoc'
  | 'pohoda'
  | 'money_isdoc'
  | 'money_native'
  | 'helios_red'
  | 'helios_inuvio'

export type CountryCode = 'cz' | 'sk'

export type PohodaRateVat = 'none' | 'low' | 'high' | 'historyHigh'

export type ExportProfile = {
  /** IČO vlastní firmy (Pohoda dataPack) */
  companyIco?: string | null
  defaultAccountCode?: string | null
  costCenter?: string | null
  contractCode?: string | null
  moneyDocumentType?: string | null
  heliosVariant?: 'red' | 'inuvio'
  country?: CountryCode
}

export type NormalizedInvoice = {
  id: string
  dodavatelNazev: string
  dodavatelIco: string
  dodavatelDic: string | null
  cisloFaktury: string
  datumVystaveni: string
  datumSplatnosti: string
  variabilniSymbol: string | null
  castkaBezDph: number
  sazbaDph: number
  castkaDph: number
  castkaCelkem: number
  mena: string
  popisPlneni: string
  iban: string | null
  ucetniKod: string
  ucetniKodNazev: string | null
  predkontace: Predkontace | null
  country: CountryCode
  auditResult: AuditResult | null
}

export type ExportError = {
  code: string
  field?: string
  message: string
}

export type ExportWarning = {
  code: string
  message: string
}

export type ExportValidationResult = {
  ok: boolean
  errors: ExportError[]
  warnings: ExportWarning[]
}

export type ExportResult =
  | {
      kind: 'text'
      content: string
      filename: string
      contentType: string
    }
  | {
      kind: 'binary'
      content: Buffer
      filename: string
      contentType: string
    }

export type ExportInput = {
  invoice: ProcessedInvoice
  profile?: ExportProfile
  forceExport?: boolean
}

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  isdoc: 'ISDOC (univerzální)',
  pohoda: 'Pohoda XML',
  money_isdoc: 'Money S3 — ISDOC',
  money_native: 'Money S3 — nativní XML',
  helios_red: 'Helios Red — CSV (ZIP)',
  helios_inuvio: 'Helios iNuvio — XML',
}

export const EXPORT_FORMATS: ExportFormat[] = [
  'isdoc',
  'pohoda',
  'money_isdoc',
  'money_native',
  'helios_red',
  'helios_inuvio',
]

export function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as string[]).includes(value)
}
