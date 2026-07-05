import type { NormalizedInvoice } from '../types'
import { escapeXml, formatDateIso, formatMoney } from '../xml-utils'

export function generateIsdoc(inv: NormalizedInvoice): string {
  const base = inv.castkaBezDph
  const vat = inv.castkaDph
  const total = inv.castkaCelkem
  const vatRate = inv.sazbaDph

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://isdoc.cz/namespace/2013" version="6.0.2">
  <DocumentType>1</DocumentType>
  <ID>${escapeXml(inv.cisloFaktury)}</ID>
  <IssueDate>${formatDateIso(inv.datumVystaveni)}</IssueDate>
  <TaxPointDate>${formatDateIso(inv.datumVystaveni)}</TaxPointDate>
  <VATApplicable>true</VATApplicable>
  <LocalCurrencyCode>${escapeXml(inv.mena)}</LocalCurrencyCode>
  <CurrRate>1</CurrRate>
  <RefCurrRate>1</RefCurrRate>
  <AccountingSupplierParty>
    <Party>
      <PartyIdentification>
        <ID>${escapeXml(inv.dodavatelIco)}</ID>
      </PartyIdentification>
      <PartyName>
        <Name>${escapeXml(inv.dodavatelNazev)}</Name>
      </PartyName>
      ${inv.dodavatelDic ? `<PartyTaxScheme><CompanyID>${escapeXml(inv.dodavatelDic)}</CompanyID></PartyTaxScheme>` : ''}
    </Party>
  </AccountingSupplierParty>
  <PaymentMeans>
    <Payment>
      <PaidAmount>${formatMoney(total)}</PaidAmount>
      <PaymentDueDate>${formatDateIso(inv.datumSplatnosti)}</PaymentDueDate>
      ${inv.variabilniSymbol ? `<PaymentID>${escapeXml(inv.variabilniSymbol)}</PaymentID>` : ''}
      ${inv.iban ? `<IBAN>${escapeXml(inv.iban)}</IBAN>` : ''}
    </Payment>
  </PaymentMeans>
  <InvoiceLines>
    <InvoiceLine>
      <ID>1</ID>
      <InvoicedQuantity>1</InvoicedQuantity>
      <LineExtensionAmount>${formatMoney(base)}</LineExtensionAmount>
      <LineExtensionAmountTaxInclusive>${formatMoney(total)}</LineExtensionAmountTaxInclusive>
      <LineExtensionTaxAmount>${formatMoney(vat)}</LineExtensionTaxAmount>
      <UnitPrice>${formatMoney(base)}</UnitPrice>
      <ClassifiedTaxCategory>
        <Percent>${vatRate}</Percent>
        <VATCalculationMethod>0</VATCalculationMethod>
      </ClassifiedTaxCategory>
      <Item>
        <Description>${escapeXml(inv.popisPlneni)}</Description>
      </Item>
    </InvoiceLine>
  </InvoiceLines>
  <TaxTotal>
    <TaxSubTotal>
      <TaxableAmount>${formatMoney(base)}</TaxableAmount>
      <TaxAmount>${formatMoney(vat)}</TaxAmount>
      <TaxCategory>
        <Percent>${vatRate}</Percent>
      </TaxCategory>
    </TaxSubTotal>
    <TaxAmount>${formatMoney(vat)}</TaxAmount>
  </TaxTotal>
  <LegalMonetaryTotal>
    <TaxExclusiveAmount>${formatMoney(base)}</TaxExclusiveAmount>
    <TaxInclusiveAmount>${formatMoney(total)}</TaxInclusiveAmount>
    <PayableAmount>${formatMoney(total)}</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>`
}
