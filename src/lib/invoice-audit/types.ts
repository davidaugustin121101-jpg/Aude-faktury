export type AuditSeverity = 'ok' | 'warning' | 'critical'

export type AuditCheck = {
  id: string
  label: string
  message: string
  severity: AuditSeverity
  /** Odkaz na existující fakturu (duplicita) */
  relatedInvoiceId?: string
}

export type AuditResult = {
  checks: AuditCheck[]
  score: number
  passedCount: number
  totalCount: number
  hasCritical: boolean
  hasWarning: boolean
}

export type InvoiceAuditInput = {
  dodavatel_nazev: string | null
  dodavatel_ico: string | null
  dodavatel_dic: string | null
  cislo_faktury: string | null
  datum_vystaveni: string | null
  datum_splatnosti: string | null
  variabilni_symbol: string | null
  castka_bez_dph: number | null
  sazba_dph: number | null
  castka_dph: number | null
  castka_celkem: number | null
  ucetni_kod: string | null
  je_prenesena_dan?: boolean | null
}
