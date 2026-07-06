import type { CountryCode } from '@/lib/accounting-codes'
import type { ProcessedInvoice } from '@/types/invoices'
import type { AuditResult } from '@/lib/invoice-audit/types'
import { predkontaceFromInvoice } from '@/lib/predkontace'
import type { ExportProfile, NormalizedInvoice } from './types'
import { formatDateIso } from './xml-utils'

const ALLOWED_VAT = [0, 10, 12, 21] as const

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function normalizeVatRate(rate: number | null | undefined): number {
  if (rate == null || Number.isNaN(rate)) return 21
  const rounded = Math.round(rate)
  if ((ALLOWED_VAT as readonly number[]).includes(rounded)) return rounded
  return ALLOWED_VAT.reduce((best, candidate) =>
    Math.abs(candidate - rounded) < Math.abs(best - rounded) ? candidate : best
  )
}

function normalizeIco(ico: string | null | undefined): string {
  return (ico ?? '').replace(/\D/g, '')
}

export function normalizeInvoice(
  invoice: ProcessedInvoice,
  profile?: ExportProfile
): NormalizedInvoice {
  const country: CountryCode = 'cz'
  const sazbaDph = normalizeVatRate(invoice.sazba_dph)
  const castkaBezDph = round2(Number(invoice.castka_bez_dph ?? 0))
  const castkaDph = round2(Number(invoice.castka_dph ?? 0))
  const castkaCelkem = round2(Number(invoice.castka_celkem ?? castkaBezDph + castkaDph))

  return {
    id: invoice.id,
    dodavatelNazev: (invoice.dodavatel_nazev ?? '').trim(),
    dodavatelIco: normalizeIco(invoice.dodavatel_ico),
    dodavatelDic: invoice.dodavatel_dic?.trim() || null,
    cisloFaktury: (invoice.cislo_faktury ?? '').trim(),
    datumVystaveni: formatDateIso(invoice.datum_vystaveni),
    datumSplatnosti: formatDateIso(invoice.datum_splatnosti ?? invoice.datum_vystaveni),
    variabilniSymbol: invoice.variabilni_symbol?.trim() || null,
    castkaBezDph,
    sazbaDph,
    castkaDph,
    castkaCelkem,
    mena: (invoice.mena ?? 'CZK').toUpperCase(),
    popisPlneni: (invoice.popis_plneni ?? invoice.dodavatel_nazev ?? 'Fakturované plnění').trim(),
    iban: invoice.iban?.replace(/\s/g, '') || null,
    ucetniKod: profile?.defaultAccountCode ?? invoice.ucetni_kod ?? '518',
    ucetniKodNazev: invoice.ucetni_kod_nazev,
    predkontace: predkontaceFromInvoice(invoice),
    country,
    auditResult: (invoice.audit_result as AuditResult | null) ?? null,
  }
}
