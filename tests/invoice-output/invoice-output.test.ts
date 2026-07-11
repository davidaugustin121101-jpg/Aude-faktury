import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildExtractedDataFromInvoice,
  buildInvoiceOutputLines,
  buildInvoicePayment,
  buildVatRecap,
  formatPaymentAccount,
} from '../../src/lib/invoice-output'
import type { ExtractedInvoiceData } from '../../src/lib/claude'

const sample: ExtractedInvoiceData = {
  dodavatel_nazev: 'Dodavatel s.r.o.',
  dodavatel_ico: '12345678',
  dodavatel_dic: 'CZ12345678',
  cislo_faktury: '2026/001',
  datum_vystaveni: '2026-07-01',
  datum_splatnosti: '2026-07-15',
  variabilni_symbol: '2026001',
  castka_bez_dph: 1000,
  sazba_dph: 21,
  castka_dph: 210,
  castka_celkem: 1210,
  mena: 'CZK',
  popis_plneni: 'IT služby',
  cislo_uctu: '1234567891/0321',
  iban: null,
  ucetni_kod: '518',
  ucetni_kod_nazev: 'Ostatní služby',
  ucetni_kod_duvod: 'test',
  ucetni_kod_confidence: 0.9,
  confidence: 0.9,
  problemy: [],
  typ_dokladu: 'faktura',
  typ_faktury: 'danovy_doklad',
  je_prenesena_dan: false,
  polozky: [
    { nazev: 'zboží', mnozstvi: 2, jednotkova_cena: 100, sazba_dph: 21, typ: 'zbozi', jednotka: 'ks' },
    { nazev: 'výrobek', mnozstvi: 1, jednotkova_cena: 800, sazba_dph: 12, typ: 'zbozi', jednotka: 'ks' },
  ],
}

describe('invoice-output', () => {
  it('builds one line per polozka', () => {
    const lines = buildInvoiceOutputLines(sample)
    assert.equal(lines.length, 2)
    assert.equal(lines[0].castkaBezDph, 200)
    assert.equal(lines[1].sazbaDph, 12)
  })

  it('formats Czech payment account', () => {
    const payment = buildInvoicePayment(sample)
    assert.equal(formatPaymentAccount(payment), '1234567891/0321')
  })

  it('builds VAT recap from lines', () => {
    const recap = buildVatRecap(buildInvoiceOutputLines(sample))
    assert.equal(recap.length, 2)
    assert.equal(recap.find((r) => r.sazbaDph === 21)?.zaklad, 200)
  })

  it('restores extracted data from processed invoice raw_extraction', () => {
    const extracted = buildExtractedDataFromInvoice({
      id: 'x',
      user_id: 'u',
      dodavatel_nazev: 'A',
      dodavatel_ico: '12345678',
      dodavatel_dic: null,
      cislo_faktury: '1',
      datum_vystaveni: '2026-01-01',
      datum_splatnosti: '2026-01-15',
      variabilni_symbol: '1',
      castka_bez_dph: 100,
      sazba_dph: 21,
      castka_dph: 21,
      castka_celkem: 121,
      mena: 'CZK',
      popis_plneni: 'test',
      iban: null,
      ucetni_kod: '518',
      ucetni_kod_nazev: null,
      ucetni_kod_duvod: null,
      ucetni_kod_confidence: null,
      confidence: 1,
      problemy: [],
      raw_extraction: {
        cislo_uctu: '111/0100',
        polozky: sample.polozky,
        datum_duzp: '2026-01-01',
      },
      status: 'pending_review',
      accounting_provider: null,
      accounting_document_id: null,
      accounting_connection_id: null,
      workspace_id: null,
      original_email_id: null,
      original_filename: null,
      storage_path: null,
      sender_email: null,
      received_at: null,
      created_at: '2026-01-01',
      processed_at: null,
      updated_at: '2026-01-01',
      audit_result: null,
      audit_score: null,
      email_connection_id: null,
    })
    assert.equal(extracted.cislo_uctu, '111/0100')
    assert.equal(extracted.polozky?.length, 2)
  })
})
