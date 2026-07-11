import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildIdokladBankFields, buildIdokladItems, formatIdokladAccountNumber, mapIdokladVatRateType } from '../../src/lib/idoklad'
import { lineGrossAmount, lineVatAmount, buildInvoiceOutputLines } from '../../src/lib/invoice-output'
import type { ExtractedInvoiceData } from '../../src/lib/claude'

const baseInvoice = {
  dodavatel_nazev: 'Firma s.r.o.',
  dodavatel_ico: '12345678',
  dodavatel_dic: 'CZ12345678',
  cislo_faktury: '2600253',
  datum_vystaveni: '2026-03-12',
  datum_splatnosti: '2026-03-26',
  variabilni_symbol: '2600253',
  castka_bez_dph: 2654722.6,
  sazba_dph: 21,
  castka_dph: 547591.75,
  castka_celkem: 3202315,
  mena: 'CZK',
  popis_plneni: 'Faktura za objednané produkty',
  iban: null,
  ucetni_kod: '504',
  ucetni_kod_nazev: 'Prodané zboží',
  ucetni_kod_duvod: 'zboží',
  ucetni_kod_confidence: 0.88,
  confidence: 0.88,
  problemy: [],
} satisfies Partial<ExtractedInvoiceData>

describe('idoklad items and bank fields', () => {
  it('maps each polozka to a separate iDoklad item', () => {
    const data = {
      ...baseInvoice,
      polozky: [
        { nazev: 'zboží', mnozstvi: 100, jednotkova_cena: 123.5, sazba_dph: 21, typ: 'zbozi' as const, jednotka: 'ks' },
        { nazev: 'výrobek', mnozstvi: 10, jednotkova_cena: 11000, sazba_dph: 12, typ: 'zbozi' as const, jednotka: 'ks' },
        { nazev: 'něco', mnozstvi: 10000, jednotkova_cena: 253.23, sazba_dph: 21, typ: 'zbozi' as const, jednotka: 'ks' },
        { nazev: 'vážené', mnozstvi: 0.22, jednotkova_cena: 330, sazba_dph: 21, typ: 'zbozi' as const, jednotka: 'kg' },
      ],
    } as ExtractedInvoiceData

    const items = buildIdokladItems(data)
    assert.equal(items.length, 4)
    assert.equal(items[0].Name, 'zboží')
    assert.equal(items[0].Amount, 100)
    assert.equal(items[0].Unit, 'ks')
    assert.equal(items[3].Unit, 'kg')
    assert.equal(items[1].VatRateType, 0)
    assert.equal(items[0].VatRateType, 1)
    assert.equal(items[0].IsTaxMovement, true)
    assert.ok(!('CustomVatRate' in items[0]))
  })

  it('maps Czech VAT rates to iDoklad VatRateType enum (od 2024)', () => {
    assert.equal(mapIdokladVatRateType(21, '2026-03-12'), 1)
    assert.equal(mapIdokladVatRateType(12, '2026-03-12'), 0)
    assert.equal(mapIdokladVatRateType(10, '2026-03-12'), 0)
    assert.equal(mapIdokladVatRateType(0, '2026-03-12'), 2)
  })

  it('maps historical 10 % to Reduced2 before 2024', () => {
    assert.equal(mapIdokladVatRateType(10, '2023-12-31'), 3)
    assert.equal(mapIdokladVatRateType(15, '2023-12-31'), 0)
  })

  it('falls back to single aggregated item when polozky are empty', () => {
    const data = { ...baseInvoice, polozky: [] } as ExtractedInvoiceData
    const items = buildIdokladItems(data)
    assert.equal(items.length, 1)
    assert.equal(items[0].UnitPrice, 2654722.6)
  })

  it('builds bank fields from Czech account number', () => {
    const data = {
      ...baseInvoice,
      cislo_uctu: '1234567891/0321',
      polozky: [],
    } as ExtractedInvoiceData

    const bank = buildIdokladBankFields(data)
    assert.equal(bank.AccountNumber, '1234567891')
    assert.equal(bank._bankCode, '0321')
    assert.equal(formatIdokladAccountNumber('1234567891', '0321', null), '1234567891/0321')
    assert.equal(formatIdokladAccountNumber('1234567891', '0321', 42), '1234567891')
  })

  it('item gross totals match Czech VAT percentages (not flat +21)', () => {
    const data = {
      ...baseInvoice,
      polozky: [
        { nazev: 'zboží', mnozstvi: 100, jednotkova_cena: 123.5, sazba_dph: 21, typ: 'zbozi' as const, jednotka: 'ks' },
        { nazev: 'výrobek', mnozstvi: 10, jednotkova_cena: 11000, sazba_dph: 12, typ: 'zbozi' as const, jednotka: 'ks' },
      ],
    } as ExtractedInvoiceData

    const lines = buildInvoiceOutputLines(data)
    assert.equal(lineGrossAmount(lines[0]), 14943.5)
    assert.equal(lineGrossAmount(lines[1]), 123200)
    assert.equal(lineVatAmount(lines[0]), 2593.5)
    assert.equal(lineVatAmount(lines[1]), 13200)
  })
})
