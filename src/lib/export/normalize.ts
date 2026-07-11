import type { CountryCode } from '@/lib/accounting-codes'
import type { ProcessedInvoice } from '@/types/invoices'
import type { AuditResult } from '@/lib/invoice-audit/types'
import { predkontaceFromInvoice } from '@/lib/predkontace'
import {
  buildExtractedDataFromInvoice,
  buildInvoiceOutputLines,
  buildInvoicePayment,
  formatPaymentAccount,
  normalizeCzechVatRate,
} from '@/lib/invoice-output'
import type { ExportProfile, NormalizedInvoice } from './types'
import { formatDateIso } from './xml-utils'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function normalizeIco(ico: string | null | undefined): string {
  return (ico ?? '').replace(/\D/g, '')
}

export function normalizeInvoice(
  invoice: ProcessedInvoice,
  profile?: ExportProfile
): NormalizedInvoice {
  const country: CountryCode = 'cz'
  const extracted = buildExtractedDataFromInvoice(invoice)
  const payment = buildInvoicePayment(extracted)
  const lines = buildInvoiceOutputLines(extracted)

  const sazbaDph = normalizeCzechVatRate(invoice.sazba_dph)
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
    datumDuzp: extracted.datum_duzp ? formatDateIso(extracted.datum_duzp) : null,
    variabilniSymbol: invoice.variabilni_symbol?.trim() || null,
    konstantniSymbol: extracted.konstantni_symbol?.trim() || null,
    cisloObjednavky: extracted.cislo_objednavky?.trim() || null,
    castkaBezDph,
    sazbaDph,
    castkaDph,
    castkaCelkem,
    mena: (invoice.mena ?? 'CZK').toUpperCase(),
    popisPlneni: (invoice.popis_plneni ?? invoice.dodavatel_nazev ?? 'Fakturované plnění').trim(),
    cisloUctu: payment.accountNumber,
    kodBanky: payment.bankCode,
    iban: payment.iban,
    swift: payment.swift,
    paymentAccount: formatPaymentAccount(payment),
    polozky: lines.map((line) => ({
      nazev: line.nazev,
      mnozstvi: line.mnozstvi,
      jednotka: line.jednotka,
      jednotkovaCena: line.jednotkovaCena,
      sazbaDph: line.sazbaDph,
      castkaBezDph: line.castkaBezDph,
      ucetniKod: line.ucetniKod ?? null,
    })),
    ucetniKod: profile?.defaultAccountCode ?? invoice.ucetni_kod ?? '518',
    ucetniKodNazev: invoice.ucetni_kod_nazev,
    predkontace: predkontaceFromInvoice(invoice),
    country,
    auditResult: (invoice.audit_result as AuditResult | null) ?? null,
  }
}
