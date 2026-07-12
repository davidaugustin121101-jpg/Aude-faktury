import type { NormalizedInvoice } from '../types'
import { buildVatRecap } from '@/lib/invoice-output'
import { escapeXml, formatDateIso, formatMoney } from '../xml-utils'

function paymentAccountXml(inv: NormalizedInvoice): string {
  if (inv.iban) return `<IBAN>${escapeXml(inv.iban)}</IBAN>`
  if (inv.paymentAccount) {
    return `<Details><PaymentDueDate>${formatDateIso(inv.datumSplatnosti)}</PaymentDueDate><ID>${escapeXml(inv.paymentAccount)}</ID></Details>`
  }
  return ''
}

function invoiceLinesXml(inv: NormalizedInvoice): string {
  return inv.polozky
    .map((line, index) => {
      const vat = (line.castkaBezDph * line.sazbaDph) / 100
      const total = line.castkaBezDph + vat
      return `    <InvoiceLine>
      <ID>${index + 1}</ID>
      <InvoicedQuantity unitCode="${escapeXml(line.jednotka)}">${line.mnozstvi}</InvoicedQuantity>
      <LineExtensionAmount>${formatMoney(line.castkaBezDph)}</LineExtensionAmount>
      <LineExtensionAmountTaxInclusive>${formatMoney(total)}</LineExtensionAmountTaxInclusive>
      <LineExtensionTaxAmount>${formatMoney(vat)}</LineExtensionTaxAmount>
      <UnitPrice>${formatMoney(line.jednotkovaCena)}</UnitPrice>
      <ClassifiedTaxCategory>
        <Percent>${line.sazbaDph}</Percent>
        <VATCalculationMethod>0</VATCalculationMethod>
      </ClassifiedTaxCategory>
      <Item>
        <Description>${escapeXml(line.nazev)}</Description>
      </Item>
    </InvoiceLine>`
    })
    .join('\n')
}

function taxTotalXml(inv: NormalizedInvoice): string {
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

  const subtotals = recap
    .map(
      (entry) => `    <TaxSubTotal>
      <TaxableAmount>${formatMoney(entry.zaklad)}</TaxableAmount>
      <TaxAmount>${formatMoney(entry.dph)}</TaxAmount>
      <TaxCategory>
        <Percent>${entry.sazbaDph}</Percent>
      </TaxCategory>
    </TaxSubTotal>`
    )
    .join('\n')

  return `<TaxTotal>
${subtotals}
    <TaxAmount>${formatMoney(inv.castkaDph)}</TaxAmount>
  </TaxTotal>`
}

export function generateIsdoc(inv: NormalizedInvoice): string {
  const taxPoint = inv.datumDuzp ?? inv.datumVystaveni

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://isdoc.cz/namespace/2013" version="6.0.2">
  <DocumentType>1</DocumentType>
  <ID>${escapeXml(inv.cisloFaktury)}</ID>
  <IssueDate>${formatDateIso(inv.datumVystaveni)}</IssueDate>
  <TaxPointDate>${formatDateIso(taxPoint)}</TaxPointDate>
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
      <PaidAmount>${formatMoney(inv.castkaCelkem)}</PaidAmount>
      <PaymentDueDate>${formatDateIso(inv.datumSplatnosti)}</PaymentDueDate>
      ${inv.variabilniSymbol ? `<PaymentID>${escapeXml(inv.variabilniSymbol)}</PaymentID>` : ''}
      ${paymentAccountXml(inv)}
    </Payment>
  </PaymentMeans>
  <InvoiceLines>
${invoiceLinesXml(inv)}
  </InvoiceLines>
  ${taxTotalXml(inv)}
  <LegalMonetaryTotal>
    <TaxExclusiveAmount>${formatMoney(inv.castkaBezDph)}</TaxExclusiveAmount>
    <TaxInclusiveAmount>${formatMoney(inv.castkaCelkem)}</TaxInclusiveAmount>
    <PayableAmount>${formatMoney(inv.castkaCelkem)}</PayableAmount>
  </LegalMonetaryTotal>
  ${inv.konstantniSymbol ? `<Note>Konstantní symbol: ${escapeXml(inv.konstantniSymbol)}</Note>` : ''}
  ${inv.cisloObjednavky ? `<Note>Číslo objednávky: ${escapeXml(inv.cisloObjednavky)}</Note>` : ''}
  ${inv.predkontace?.comment ? `<Note>${escapeXml(inv.predkontace.comment)}</Note>` : ''}
  ${inv.swift ? `<Note>SWIFT: ${escapeXml(inv.swift)}</Note>` : ''}
</Invoice>`
}
