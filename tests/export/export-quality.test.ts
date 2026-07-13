import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import iconv from 'iconv-lite'
import { normalizeInvoice } from '../../src/lib/export/normalize'
import { validateForExport } from '../../src/lib/export/validate-export'
import { generateExport } from '../../src/lib/export'
import { generateIsdoc } from '../../src/lib/export/generators/isdoc'
import { generatePohodaXml } from '../../src/lib/export/generators/pohoda-xml'
import { encodeHeliosCsv, generateHeliosRedCsv } from '../../src/lib/export/generators/helios-red-csv'
import { generateMoneyNativeXml } from '../../src/lib/export/generators/money-s3-native'
import { sampleInvoice } from '../fixtures/invoices/sample'
import { assertWellFormedXml, parseXml, xmlIncludes } from './xml-assert'

const exportProfile = {
  companyIco: '87654321',
  defaultAccountCode: '518',
  costCenter: '100',
  contractCode: 'ZAK-01',
  moneyDocumentType: 'FP',
}

const invoiceWithLines = {
  ...sampleInvoice,
  datum_vystaveni: '2024-06-15',
  raw_extraction: {
    je_prenesena_dan: false,
    datum_duzp: '2024-06-20',
    polozky: [
      { nazev: 'Služba A', mnozstvi: 1, jednotkova_cena: 600, sazba_dph: 21, typ: 'sluzba' },
      { nazev: 'Služba B', mnozstvi: 1, jednotkova_cena: 400, sazba_dph: 21, typ: 'sluzba' },
    ],
  },
}

describe('export validation — ERP prerequisites', () => {
  it('blocks Pohoda export without company ICO in profile', () => {
    const inv = normalizeInvoice(sampleInvoice, exportProfile)
    const result = validateForExport(inv, 'pohoda', { profile: { companyIco: '' } })
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.code === 'missing_company_ico'))
  })

  it('allows Pohoda export with company ICO', () => {
    const inv = normalizeInvoice(sampleInvoice, exportProfile)
    const result = validateForExport(inv, 'pohoda', { profile: exportProfile })
    assert.equal(result.ok, true)
  })
})

describe('ISDOC export quality', () => {
  it('generates well-formed ISDOC 6.0.2 XML with required totals', () => {
    const inv = normalizeInvoice(invoiceWithLines, exportProfile)
    const xml = generateIsdoc(inv)
    assertWellFormedXml(xml, 'ISDOC')
    xmlIncludes(
      xml,
      'xmlns="http://isdoc.cz/namespace/2013"',
      'version="6.0.2"',
      '<DocumentType>1</DocumentType>',
      '<PayableAmount>1210.00</PayableAmount>',
      '<TaxInclusiveAmount>1210.00</TaxInclusiveAmount>'
    )
    const parsed = parseXml(xml)
    assert.equal(parsed.Invoice?.ID, 'FV2024/001')
  })
})

describe('Pohoda XML export quality', () => {
  it('generates Stormware dataPack with inland VAT and company ICO', () => {
    const inv = normalizeInvoice(invoiceWithLines, exportProfile)
    const xml = generatePohodaXml(inv, exportProfile)
    assertWellFormedXml(xml, 'Pohoda')
    xmlIncludes(
      xml,
      'ico="87654321"',
      'receivedInvoice',
      'classificationVATType',
      'inland',
      '<typ:ids>518</typ:ids>'
    )
    assert.ok(!xml.includes('<inv:code>'), 'účetní kód nesmí být v inv:code (kód zboží)')
  })
})

describe('Helios Red CSV export quality', () => {
  it('uses issue date in DATUM and DUZP in DATUM2', () => {
    const inv = normalizeInvoice(invoiceWithLines, exportProfile)
    const { prifak } = generateHeliosRedCsv(inv, exportProfile)
    const lines = prifak.split('\r\n')
    assert.equal(lines.length, 2)
    const row = lines[1].split(',')
    assert.equal(row[1], '15-06-2024', 'DATUM = vystavení')
    assert.equal(row[2], '20-06-2024', 'DATUM2 = DUZP')
  })

  it('generates single PRIPOL summary row linked to CISLO 1', () => {
    const inv = normalizeInvoice(invoiceWithLines, exportProfile)
    const { pripol } = generateHeliosRedCsv(inv, exportProfile)
    const lines = pripol.split('\r\n')
    assert.equal(lines.length, 2, 'PRIPOL = hlavička + 1 souhrnný řádek')
    const row = lines[1].split(',')
    assert.equal(row[0], '1', 'P_CISLO')
    assert.equal(row[1], '15-06-2024', 'P_TYP = datum vystavení')
    assert.equal(row[2], 'FP')
    assert.equal(row[3], 'Dodavatel s.r.o.')
  })

  it('encodes CSV as Windows-1250 with Czech diacritics', () => {
    const inv = normalizeInvoice(
      { ...invoiceWithLines, dodavatel_nazev: 'Dodavatel řešení s.r.o.' },
      exportProfile
    )
    const { prifak } = generateHeliosRedCsv(inv, exportProfile)
    const buf = encodeHeliosCsv(prifak)
    const decoded = iconv.decode(buf, 'win1250')
    assert.ok(decoded.includes('řešení'))
  })
})

describe('Money S3 export quality', () => {
  it('generates well-formed native XML', () => {
    const inv = normalizeInvoice(sampleInvoice, exportProfile)
    const xml = generateMoneyNativeXml(inv, exportProfile)
    assertWellFormedXml(xml, 'Money native')
    xmlIncludes(xml, '<FakturaPrijata>', '<Druh>FP</Druh>', '<CisloDokladu>FV2024/001</CisloDokladu>')
  })
})

describe('generateExport end-to-end', () => {
  it('produces downloadable files for all formats', async () => {
    const inv = normalizeInvoice(invoiceWithLines, exportProfile)
    const formats = [
      'isdoc',
      'pohoda',
      'money_isdoc',
      'money_native',
      'helios_red',
      'helios_inuvio',
    ] as const

    for (const format of formats) {
      const { result, validation } = await generateExport(format, {
        invoice: invoiceWithLines,
        profile: exportProfile,
      })
      assert.equal(validation.ok, true, `${format} validation failed: ${validation.errors.map((e) => e.message).join('; ')}`)
      assert.ok(result.filename.length > 0, `${format} filename`)

      if (format === 'helios_red') {
        assert.equal(result.kind, 'binary')
        const zip = await JSZip.loadAsync(result.content as Buffer)
        assert.ok(zip.file('PRIFAK.csv'))
        assert.ok(zip.file('PRIPOL.csv'))
      } else {
        assert.equal(result.kind, 'text')
        assertWellFormedXml(result.content as string, format)
      }
    }
  })
})
