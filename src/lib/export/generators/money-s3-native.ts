import type { ExportProfile, NormalizedInvoice } from '../types'
import { escapeXml, formatDateIso, formatMoney } from '../xml-utils'

/**
 * Money S3 nativní XML pro přijaté faktury (FP).
 * Best-effort struktura — pro produkční jistotu preferujte money_isdoc.
 */
export function generateMoneyNativeXml(inv: NormalizedInvoice, profile?: ExportProfile): string {
  const docType = profile?.moneyDocumentType ?? 'FP'

  return `<?xml version="1.0" encoding="UTF-8"?>
<S5Data>
  <FakturaPrijataList>
    <FakturaPrijata>
      <Druh>${escapeXml(docType)}</Druh>
      <CisloDokladu>${escapeXml(inv.cisloFaktury)}</CisloDokladu>
      <VariabilniSymbol>${escapeXml(inv.variabilniSymbol ?? inv.cisloFaktury)}</VariabilniSymbol>
      <DatumVystaveni>${formatDateIso(inv.datumVystaveni)}</DatumVystaveni>
      <DatumZdanPlneni>${formatDateIso(inv.datumVystaveni)}</DatumZdanPlneni>
      <DatumSplatnosti>${formatDateIso(inv.datumSplatnosti)}</DatumSplatnosti>
      <Partner>
        <Nazev>${escapeXml(inv.dodavatelNazev)}</Nazev>
        <ICO>${escapeXml(inv.dodavatelIco)}</ICO>
        ${inv.dodavatelDic ? `<DIC>${escapeXml(inv.dodavatelDic)}</DIC>` : ''}
      </Partner>
      <Mena>${escapeXml(inv.mena)}</Mena>
      <Celkem>${formatMoney(inv.castkaCelkem)}</Celkem>
      <Zaklad>${formatMoney(inv.castkaBezDph)}</Zaklad>
      <DPH>${formatMoney(inv.castkaDph)}</DPH>
      <SazbaDPH>${inv.sazbaDph}</SazbaDPH>
      <UcetniKod>${escapeXml(inv.ucetniKod)}</UcetniKod>
      <Popis>${escapeXml(inv.popisPlneni)}</Popis>
      ${inv.iban ? `<IBAN>${escapeXml(inv.iban)}</IBAN>` : ''}
      <Poznamka>Export Faktury Audeflow</Poznamka>
    </FakturaPrijata>
  </FakturaPrijataList>
</S5Data>`
}
