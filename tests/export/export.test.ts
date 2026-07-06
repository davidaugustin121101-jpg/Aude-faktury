import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeInvoice } from '../../src/lib/export/normalize'
import { validateForExport } from '../../src/lib/export/validate-export'
import { generateIsdoc } from '../../src/lib/export/generators/isdoc'
import { generatePohodaXml } from '../../src/lib/export/generators/pohoda-xml'
import { generateHeliosRedCsv } from '../../src/lib/export/generators/helios-red-csv'
import { generateMoneyNativeXml } from '../../src/lib/export/generators/money-s3-native'
import { generateHeliosInuvioXml } from '../../src/lib/export/generators/helios-inuvio-xml'
import { sampleInvoice } from '../fixtures/invoices/sample'

describe('export normalize', () => {
  it('normalizes amounts and ico', () => {
    const inv = normalizeInvoice({
      ...sampleInvoice,
      dodavatel_ico: '12 345 678',
      castka_celkem: 1210,
    })
    assert.equal(inv.dodavatelIco, '12345678')
    assert.equal(inv.castkaCelkem, 1210)
    assert.equal(inv.sazbaDph, 21)
    assert.ok(inv.predkontace)
    assert.equal(inv.predkontace?.display, '518 / 343 / 321')
  })
})

describe('export validate', () => {
  it('passes valid invoice for isdoc', () => {
    const inv = normalizeInvoice(sampleInvoice)
    const result = validateForExport(inv, 'isdoc')
    assert.equal(result.ok, true)
    assert.equal(result.errors.length, 0)
  })

  it('blocks export on math mismatch', () => {
    const inv = normalizeInvoice({
      ...sampleInvoice,
      castka_celkem: 9999,
    })
    const result = validateForExport(inv, 'pohoda')
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.code === 'math_mismatch'))
  })

  it('blocks export on critical audit', () => {
    const inv = normalizeInvoice({
      ...sampleInvoice,
      audit_result: {
        checks: [],
        score: 50,
        passedCount: 3,
        totalCount: 7,
        hasCritical: true,
        hasWarning: true,
      },
    })
    const result = validateForExport(inv, 'isdoc')
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.code === 'critical_audit'))
  })

  it('allows force export on critical audit', () => {
    const inv = normalizeInvoice({
      ...sampleInvoice,
      audit_result: {
        checks: [],
        score: 50,
        passedCount: 3,
        totalCount: 7,
        hasCritical: true,
        hasWarning: true,
      },
    })
    const result = validateForExport(inv, 'isdoc', { forceExport: true })
    assert.equal(result.ok, true)
  })
})

describe('export generators golden snippets', () => {
  const inv = normalizeInvoice(sampleInvoice)

  it('generates ISDOC with invoice number', () => {
    const xml = generateIsdoc(inv)
    assert.ok(xml.includes('FV2024/001'))
    assert.ok(xml.includes('http://isdoc.cz/namespace/2013'))
    assert.ok(xml.includes('<PayableAmount>1210.00</PayableAmount>'))
  })

  it('generates Pohoda XML with receivedInvoice and rateVAT high', () => {
    const xml = generatePohodaXml(inv)
    assert.ok(xml.includes('receivedInvoice'))
    assert.ok(xml.includes('<inv:rateVAT>high</inv:rateVAT>'))
    assert.ok(xml.includes('<typ:ico>12345678</typ:ico>'))
    assert.ok(xml.includes('Předkontace:'))
  })

  it('generates Helios Red CSV headers', () => {
    const { prifak, pripol } = generateHeliosRedCsv(inv)
    assert.ok(prifak.startsWith('CISLO,DATUM,DATUM2'))
    assert.ok(prifak.includes('FV2024/001'))
    assert.ok(pripol.startsWith('P_CISLO,P_TYP'))
    assert.ok(pripol.includes('FP'))
  })

  it('generates Money native XML', () => {
    const xml = generateMoneyNativeXml(inv)
    assert.ok(xml.includes('<FakturaPrijata>'))
    assert.ok(xml.includes('<CisloDokladu>FV2024/001</CisloDokladu>'))
  })

  it('generates Helios iNuvio XML from Pohoda structure', () => {
    const xml = generateHeliosInuvioXml(inv)
    assert.ok(xml.includes('Helios iNuvio'))
    assert.ok(xml.includes('stormware.cz'))
  })
})

describe('export math invariant', () => {
  it('normalized invoice preserves base + vat = total', () => {
    const inv = normalizeInvoice(sampleInvoice)
    assert.ok(Math.abs(inv.castkaBezDph + inv.castkaDph - inv.castkaCelkem) <= 0.02)
  })
})
