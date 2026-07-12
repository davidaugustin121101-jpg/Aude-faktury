import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hashPdfBuffer, isSimpleTextInvoice } from '../../src/lib/pdf-preprocess'
import { normalizeExtractedInvoice } from '../../src/lib/claude'
import { applyDefaultHeaderUcetniKod } from '../../src/lib/polozky-predkontace'
import { PDF_MAX_BYTES, PDF_MAX_PAGES, EXTRACTION_MAX_TOKENS } from '../../src/lib/pdf-limits'

describe('pdf extraction limits', () => {
  it('exports expected limits', () => {
    assert.equal(PDF_MAX_BYTES, 5 * 1024 * 1024)
    assert.equal(PDF_MAX_PAGES, 3)
    assert.equal(EXTRACTION_MAX_TOKENS, 2048)
  })
})

describe('pdf-preprocess', () => {
  it('hashPdfBuffer is stable for same bytes', () => {
    const buf = Buffer.from('test-pdf-content')
    assert.equal(hashPdfBuffer(buf), hashPdfBuffer(buf))
    assert.notEqual(hashPdfBuffer(buf), hashPdfBuffer(Buffer.from('other')))
  })

  it('isSimpleTextInvoice detects simple one-page invoices', () => {
    assert.equal(isSimpleTextInvoice({ pageCount: 1, textLength: 500 }), true)
    assert.equal(isSimpleTextInvoice({ pageCount: 2, textLength: 500 }), false)
    assert.equal(isSimpleTextInvoice({ pageCount: 1, textLength: 50 }), false)
  })
})

describe('extraction post-processing', () => {
  it('normalizeExtractedInvoice fills optional arrays', () => {
    const data = normalizeExtractedInvoice({
      dodavatel_nazev: 'ACME',
      dodavatel_ico: '12345678',
      dodavatel_dic: null,
      cislo_faktury: '2026/1',
      datum_vystaveni: '2026-01-01',
      datum_splatnosti: '2026-01-15',
      variabilni_symbol: '',
      castka_bez_dph: 100,
      sazba_dph: 21,
      castka_dph: 21,
      castka_celkem: 121,
      mena: 'CZK',
      popis_plneni: 'Služby',
      iban: null,
      confidence: 0.9,
      problemy: [],
    })
    assert.deepEqual(data.problemy, [])
    assert.deepEqual(data.polozky, [])
  })

  it('applyDefaultHeaderUcetniKod suggests code from popis', () => {
    const data = applyDefaultHeaderUcetniKod({
      dodavatel_nazev: 'ACME',
      dodavatel_ico: '12345678',
      dodavatel_dic: null,
      cislo_faktury: '2026/1',
      datum_vystaveni: '2026-01-01',
      datum_splatnosti: '2026-01-15',
      variabilni_symbol: '',
      castka_bez_dph: 100,
      sazba_dph: 21,
      castka_dph: 21,
      castka_celkem: 121,
      mena: 'CZK',
      popis_plneni: 'Faktura za elektřinu',
      iban: null,
      confidence: 0.9,
      problemy: [],
      polozky: [],
    })
    assert.equal(data.ucetni_kod, '502')
    assert.equal(data.ucetni_kod_nazev, 'Spotřeba energie')
  })
})
