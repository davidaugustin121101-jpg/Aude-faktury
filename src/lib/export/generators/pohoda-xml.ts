import type { ExportProfile, NormalizedInvoice } from '../types'
import { mapPohodaRateVat } from '../vat-mapping'
import { escapeXml, formatDateIso, formatMoney } from '../xml-utils'

export function generatePohodaXml(inv: NormalizedInvoice, profile?: ExportProfile): string {
  const rateVat = mapPohodaRateVat(inv.sazbaDph, inv.country)
  const companyIco = profile?.companyIco ?? ''
  const base = inv.castkaBezDph
  const vat = inv.castkaDph
  const total = inv.castkaCelkem

  const priceNone = rateVat === 'none' ? formatMoney(base) : '0'
  const priceLow = rateVat === 'low' ? formatMoney(base) : '0'
  const priceHigh = rateVat === 'high' || rateVat === 'historyHigh' ? formatMoney(base) : '0'

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
        <inv:dateTax>${formatDateIso(inv.datumVystaveni)}</inv:dateTax>
        <inv:dateDue>${formatDateIso(inv.datumSplatnosti)}</inv:dateDue>
        <inv:accounting>
          <typ:ids>${escapeXml(inv.ucetniKod)}</typ:ids>
        </inv:accounting>
        <inv:classificationVAT>
          <typ:ids>${rateVat}</typ:ids>
        </inv:classificationVAT>
        <inv:text>${escapeXml(inv.popisPlneni)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(inv.dodavatelNazev)}</typ:company>
            <typ:ico>${escapeXml(inv.dodavatelIco)}</typ:ico>
            ${inv.dodavatelDic ? `<typ:dic>${escapeXml(inv.dodavatelDic)}</typ:dic>` : ''}
          </typ:address>
        </inv:partnerIdentity>
        ${inv.variabilniSymbol ? `<inv:symVar>${escapeXml(inv.variabilniSymbol)}</inv:symVar>` : ''}
        ${inv.iban ? `<inv:paymentAccount><typ:accountNo>${escapeXml(inv.iban)}</typ:accountNo></inv:paymentAccount>` : ''}
        <inv:paymentType>
          <typ:paymentType>draft</typ:paymentType>
        </inv:paymentType>
        <inv:note>Export z Faktury Audeflow</inv:note>
      </inv:invoiceHeader>
      <inv:invoiceDetail>
        <inv:invoiceItem>
          <inv:text>${escapeXml(inv.popisPlneni)}</inv:text>
          <inv:quantity>1</inv:quantity>
          <inv:rateVAT>${rateVat}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${formatMoney(base)}</typ:unitPrice>
            <typ:price>${formatMoney(base)}</typ:price>
            <typ:priceVAT>${formatMoney(vat)}</typ:priceVAT>
            <typ:priceSum>${formatMoney(total)}</typ:priceSum>
          </inv:homeCurrency>
          <inv:code>${escapeXml(inv.ucetniKod)}</inv:code>
        </inv:invoiceItem>
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${priceNone}</typ:priceNone>
          <typ:priceLow>${priceLow}</typ:priceLow>
          <typ:priceHigh>${priceHigh}</typ:priceHigh>
          <typ:priceHighVAT>${formatMoney(vat)}</typ:priceHighVAT>
          <typ:priceHighSum>${formatMoney(total)}</typ:priceHighSum>
          <typ:currency>
            <typ:ids>${escapeXml(inv.mena)}</typ:ids>
          </typ:currency>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>
</dat:dataPack>`
}
