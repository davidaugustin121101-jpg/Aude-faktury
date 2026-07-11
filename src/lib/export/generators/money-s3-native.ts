import type { ExportProfile, NormalizedInvoice } from '../types'
import { escapeXml, formatDateIso, formatMoney } from '../xml-utils'

function polozkyXml(inv: NormalizedInvoice): string {
  return inv.polozky
    .map((line, index) => {
      const vat = (line.castkaBezDph * line.sazbaDph) / 100
      const total = line.castkaBezDph + vat
      return `      <Polozka>
        <Poradi>${index + 1}</Poradi>
        <Nazev>${escapeXml(line.nazev)}</Nazev>
        <Mnozstvi>${line.mnozstvi}</Mnozstvi>
        <Jednotka>${escapeXml(line.jednotka)}</Jednotka>
        <JednotkovaCena>${formatMoney(line.jednotkovaCena)}</JednotkovaCena>
        <Zaklad>${formatMoney(line.castkaBezDph)}</Zaklad>
        <SazbaDPH>${line.sazbaDph}</SazbaDPH>
        <DPH>${formatMoney(vat)}</DPH>
        <Celkem>${formatMoney(total)}</Celkem>
        <UcetniKod>${escapeXml(line.ucetniKod ?? inv.ucetniKod)}</UcetniKod>
      </Polozka>`
    })
    .join('\n')
}

/**
 * Money S3 nativní XML pro přijaté faktury (FP).
 * Best-effort struktura — pro produkční jistotu preferujte money_isdoc.
 */
export function generateMoneyNativeXml(inv: NormalizedInvoice, profile?: ExportProfile): string {
  const docType = profile?.moneyDocumentType ?? 'FP'
  const taxDate = inv.datumDuzp ?? inv.datumVystaveni

  return `<?xml version="1.0" encoding="UTF-8"?>
<S5Data>
  <FakturaPrijataList>
    <FakturaPrijata>
      <Druh>${escapeXml(docType)}</Druh>
      <CisloDokladu>${escapeXml(inv.cisloFaktury)}</CisloDokladu>
      <VariabilniSymbol>${escapeXml(inv.variabilniSymbol ?? inv.cisloFaktury)}</VariabilniSymbol>
      ${inv.konstantniSymbol ? `<KonstantniSymbol>${escapeXml(inv.konstantniSymbol)}</KonstantniSymbol>` : ''}
      ${inv.cisloObjednavky ? `<CisloObjednavky>${escapeXml(inv.cisloObjednavky)}</CisloObjednavky>` : ''}
      <DatumVystaveni>${formatDateIso(inv.datumVystaveni)}</DatumVystaveni>
      <DatumZdanPlneni>${formatDateIso(taxDate)}</DatumZdanPlneni>
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
      ${inv.paymentAccount ? `<CisloUctu>${escapeXml(inv.paymentAccount)}</CisloUctu>` : ''}
      ${inv.iban ? `<IBAN>${escapeXml(inv.iban)}</IBAN>` : ''}
      ${inv.swift ? `<SWIFT>${escapeXml(inv.swift)}</SWIFT>` : ''}
      <Poznamka>${escapeXml(inv.predkontace?.comment ?? 'Export Faktury Audeflow')}</Poznamka>
      <Polozky>
${polozkyXml(inv)}
      </Polozky>
    </FakturaPrijata>
  </FakturaPrijataList>
</S5Data>`
}
