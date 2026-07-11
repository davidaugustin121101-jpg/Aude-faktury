import type { ExportProfile, NormalizedInvoice } from '../types'
import { buildVatRecap } from '@/lib/invoice-output'
import { mapPohodaRateVat } from '../vat-mapping'
import { escapeXml, formatDateIso, formatMoney } from '../xml-utils'

function invoiceItemsXml(inv: NormalizedInvoice): string {
  return inv.polozky
    .map((line) => {
      const rateVat = mapPohodaRateVat(line.sazbaDph)
      const vat = (line.castkaBezDph * line.sazbaDph) / 100
      const total = line.castkaBezDph + vat
      const accountingCode = line.ucetniKod ?? inv.ucetniKod
      return `        <inv:invoiceItem>
          <inv:text>${escapeXml(line.nazev)}</inv:text>
          <inv:quantity>${line.mnozstvi}</inv:quantity>
          <inv:unit>${escapeXml(line.jednotka)}</inv:unit>
          <inv:rateVAT>${rateVat}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${formatMoney(line.jednotkovaCena)}</typ:unitPrice>
            <typ:price>${formatMoney(line.castkaBezDph)}</typ:price>
            <typ:priceVAT>${formatMoney(vat)}</typ:priceVAT>
            <typ:priceSum>${formatMoney(total)}</typ:priceSum>
          </inv:homeCurrency>
          <inv:code>${escapeXml(accountingCode)}</inv:code>
        </inv:invoiceItem>`
    })
    .join('\n')
}

export function generatePohodaXml(inv: NormalizedInvoice, profile?: ExportProfile): string {
  const companyIco = profile?.companyIco ?? ''
  const taxDate = inv.datumDuzp ?? inv.datumVystaveni
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd"
              xmlns:inv="http://www.stormware.cz/schema/version_2/invoice.xsd"
              xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd"
              version="2.0" id="Audeflow" ico="${escapeXml(companyIco)}" application="Faktury Audeflow" note="Export faktury">
  <dat:dataPackItem version="2.0" id="${escapeXml(inv.id)}">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>receivedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${escapeXml(inv.cisloFaktury)}</typ:numberRequested>
        </inv:number>
        <inv:date>${formatDateIso(inv.datumVystaveni)}</inv:date>
        <inv:dateTax>${formatDateIso(taxDate)}</inv:dateTax>
        <inv:dateDue>${formatDateIso(inv.datumSplatnosti)}</inv:dateDue>
        <inv:accounting>
          <typ:ids>${escapeXml(inv.ucetniKod)}</typ:ids>
        </inv:accounting>
        <inv:text>${escapeXml(inv.popisPlneni)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(inv.dodavatelNazev)}</typ:company>
            <typ:ico>${escapeXml(inv.dodavatelIco)}</typ:ico>
            ${inv.dodavatelDic ? `<typ:dic>${escapeXml(inv.dodavatelDic)}</typ:dic>` : ''}
          </typ:address>
        </inv:partnerIdentity>
        ${inv.variabilniSymbol ? `<inv:symVar>${escapeXml(inv.variabilniSymbol)}</inv:symVar>` : ''}
        ${inv.konstantniSymbol ? `<inv:symConst>${escapeXml(inv.konstantniSymbol)}</inv:symConst>` : ''}
        ${inv.cisloObjednavky ? `<inv:numberOrder>${escapeXml(inv.cisloObjednavky)}</inv:numberOrder>` : ''}
        ${inv.paymentAccount ? `<inv:paymentAccount><typ:accountNo>${escapeXml(inv.paymentAccount)}</typ:accountNo></inv:paymentAccount>` : ''}
        <inv:paymentType>
          <typ:paymentType>draft</typ:paymentType>
        </inv:paymentType>
        <inv:note>${escapeXml(inv.predkontace?.comment ?? 'Export z Faktury Audeflow')}</inv:note>
      </inv:invoiceHeader>
      <inv:invoiceDetail>
${invoiceItemsXml(inv)}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${formatMoney(base0)}</typ:priceNone>
          <typ:priceLow>${formatMoney(base12)}</typ:priceLow>
          <typ:priceLowVAT>${formatMoney(vat12)}</typ:priceLowVAT>
          <typ:priceHigh>${formatMoney(base21)}</typ:priceHigh>
          <typ:priceHighVAT>${formatMoney(vat21)}</typ:priceHighVAT>
          <typ:priceHighSum>${formatMoney(inv.castkaCelkem)}</typ:priceHighSum>
          <typ:currency>
            <typ:ids>${escapeXml(inv.mena)}</typ:ids>
          </typ:currency>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>
</dat:dataPack>`
}
