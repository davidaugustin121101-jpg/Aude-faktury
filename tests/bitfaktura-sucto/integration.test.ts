import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildBitFakturaInvoicePayload,
  normalizeBitFakturaDomain,
  bitfakturaBaseUrl,
} from '../../src/lib/bitfaktura.ts'
import { pickVatId, buildSuctoActuarialPayload, buildVatIdByRate } from '../../src/lib/sucto.ts'
import { buildSuperFakturaPayload } from '../../src/lib/superfaktura.ts'
import { buildFakturoidExpensePayload } from '../../src/lib/fakturoid.ts'
import { buildIdokladItems } from '../../src/lib/idoklad.ts'
import {
  buildInvoiceOutputLines,
  buildVatRecap,
  lineGrossAmount,
  lineVatAmount,
} from '../../src/lib/invoice-output.ts'
import type { ExtractedInvoiceData } from '../../src/lib/claude.ts'

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
    { nazev: 'Služba', mnozstvi: 1, jednotkova_cena: 1000, sazba_dph: 21, typ: 'sluzba' as const },
  ],
  cislo_uctu: '1234567891/0321',
  konstantni_symbol: '308',
  cislo_objednavky: '2600128',
  datum_duzp: '2026-07-01',
}

/** Reálná faktura se smíšenými sazbami 21 % + 12 % */
const multiRate: ExtractedInvoiceData = {
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
  cislo_uctu: '1234567891/',
  kod_banky: '321',
  iban: null,
  ucetni_kod: '504',
  ucetni_kod_nazev: 'Prodané zboží',
  ucetni_kod_duvod: 'zboží',
  ucetni_kod_confidence: 0.88,
  confidence: 0.88,
  problemy: [],
  typ_dokladu: 'faktura',
  typ_faktury: 'danovy_doklad',
  je_prenesena_dan: false,
  datum_duzp: '2026-03-12',
  polozky: [
    { nazev: 'zboží', mnozstvi: 100, jednotkova_cena: 123.5, sazba_dph: 21, typ: 'zbozi', jednotka: 'ks' },
    { nazev: 'výrobek', mnozstvi: 10, jednotkova_cena: 11000, sazba_dph: 12, typ: 'zbozi', jednotka: 'ks' },
    { nazev: 'něco', mnozstvi: 10000, jednotkova_cena: 253.23, sazba_dph: 21, typ: 'zbozi', jednotka: 'ks' },
    { nazev: 'vážené', mnozstvi: 0.22, jednotkova_cena: 330, sazba_dph: 21, typ: 'zbozi', jednotka: 'kg' },
  ],
}

describe('multi-rate invoice (all providers)', () => {
  const lines = buildInvoiceOutputLines(multiRate)
  const recap = buildVatRecap(lines)
  const totalBase = lines.reduce((s, l) => s + l.castkaBezDph, 0)
  const totalVat = lines.reduce((s, l) => s + lineVatAmount(l), 0)
  const totalGross = lines.reduce((s, l) => s + lineGrossAmount(l), 0)

  it('shared layer matches invoice totals', () => {
    assert.equal(lines.length, 4)
    assert.equal(totalBase, 2654722.6)
    assert.equal(totalVat, 547591.75)
    assert.equal(totalGross, 3202314.35)
    assert.equal(recap.length, 2)
    assert.equal(recap.find((r) => r.sazbaDph === 12)?.dph, 13200)
  })

  it('superfaktura sends per-line tax and bank 0321', () => {
    const payload = buildSuperFakturaPayload(multiRate)
    const items = payload.ExpenseItem as Array<{ tax: number; unit_price: number }>
    assert.equal(items.length, 4)
    assert.equal(items[1].tax, 12)
    assert.equal((payload.Client as { account: string }).account, '1234567891/0321')
  })

  it('fakturoid uses without_vat and per-line rates', () => {
    const payload = buildFakturoidExpensePayload(multiRate)
    assert.equal(payload.vat_price_mode, 'without_vat')
    assert.equal(payload.lines.length, 4)
    assert.equal(payload.lines[1].vat_rate, '12')
  })

  it('bitfaktura sends net, VAT and gross per position', () => {
    const payload = buildBitFakturaInvoicePayload(multiRate)
    const positions = payload.positions as Array<{
      tax: number
      price_net: number
      total_price_net: number
      total_price_tax: number
      total_price_gross: number
    }>
    assert.equal(positions.length, 4)
    assert.equal(positions[0].tax, 21)
    assert.equal(positions[0].price_net, 123.5)
    assert.equal(positions[1].total_price_net, 110000)
    assert.equal(positions[1].total_price_tax, 13200)
    assert.equal(positions[1].total_price_gross, 123200)
    assert.equal(payload.seller_bank_account, '1234567891/0321')
    assert.equal(payload.seller_tax_no, '12345678')
  })

  it('sucto sends base, tax and total per line', () => {
    const vats = [
      { id: 1, value: '21.0' },
      { id: 2, value: '12.0' },
    ]
    const payload = buildSuctoActuarialPayload({
      data: multiRate,
      init: { account: { id: 5, country_id: 47 }, currency: { id: 26 } },
      partnerId: 99,
      actuarialTypeId: 1,
      vatIdByRate: buildVatIdByRate(vats),
      fallbackVatId: 9,
    })
    const suctoLines = payload.lines as Array<{ base_price: number; tax: number; total_price: number; vat_id: number }>
    assert.equal(suctoLines[1].base_price, 110000)
    assert.equal(suctoLines[1].tax, 13200)
    assert.equal(suctoLines[1].total_price, 123200)
    assert.equal(suctoLines[1].vat_id, 2)
    assert.equal(payload.bank_number, '1234567891/0321')
  })

  it('idoklad maps mixed VAT rates per item', () => {
    const items = buildIdokladItems(multiRate, { vatCodeId: 24 })
    assert.equal(items.length, 4)
    assert.equal(items[1].VatRateType, 0)
    assert.equal(items[0].VatCodeId, 24)
    assert.ok(!('IsTaxMovement' in items[0]))
  })
})

describe('bitfaktura', () => {
  it('normalizes domain', () => {
    assert.equal(normalizeBitFakturaDomain('https://mojefirma.bitfaktura.cz/'), 'mojefirma')
    assert.equal(bitfakturaBaseUrl('mojefirma'), 'https://mojefirma.bitfaktura.cz')
  })

  it('builds expense invoice payload with bank and symbols', () => {
    const payload = buildBitFakturaInvoicePayload(sample)
    assert.equal(payload.income, '0')
    assert.equal(payload.seller_bank_account, '1234567891/0321')
    assert.equal(payload.oid, '2600128')
    assert.match(String(payload.internal_note), /VS: 2026001/)
    assert.match(String(payload.internal_note), /KS: 308/)
    assert.match(String(payload.internal_note), /Obj\. č\.: 2600128/)
    assert.equal((payload.positions as unknown[]).length, 1)
    assert.ok(!('variable_symbol' in payload))
    assert.ok(!('constant_symbol' in payload))
    assert.ok(!('order_number' in payload))
  })
})

describe('superfaktura payload', () => {
  it('uses items version with ExpenseItem array', () => {
    const payload = buildSuperFakturaPayload(sample)
    assert.equal((payload.Expense as { version: string }).version, 'items')
    assert.ok(Array.isArray(payload.ExpenseItem))
    assert.equal((payload.ExpenseItem as unknown[]).length, 1)
    assert.equal((payload.Client as { account: string }).account, '1234567891/0321')
  })

  it('always sends items mode even without polozky array', () => {
    const payload = buildSuperFakturaPayload({ ...sample, polozky: [] })
    assert.equal((payload.Expense as { version: string }).version, 'items')
    assert.equal((payload.ExpenseItem as unknown[]).length, 1)
  })
})

describe('fakturoid payload', () => {
  it('maps multiple lines and DUZP', () => {
    const payload = buildFakturoidExpensePayload(sample)
    assert.equal(payload.taxable_fulfillment_due, '2026-07-01')
    assert.equal(payload.lines.length, 1)
    assert.match(payload.note ?? '', /KS: 308/)
    assert.match(payload.note ?? '', /Předkontace:/)
  })

  it('includes full predkontace in note for multi-rate invoice', () => {
    const payload = buildFakturoidExpensePayload(multiRate)
    assert.match(payload.note ?? '', /Předkontace: 504 \/ 343 \/ 321/)
    assert.match(payload.note ?? '', /Dal 321/)
  })
})

describe('sucto', () => {
  it('picks vat by rate', () => {
    const vats = [
      { id: 1, value: '21.0' },
      { id: 2, value: '12.0' },
    ]
    assert.equal(pickVatId(vats, 21), 1)
    assert.equal(pickVatId(vats, 12), 2)
  })

  it('builds actuarial payload with lines and bank', () => {
    const vats = [
      { id: 1, value: '21.0' },
      { id: 2, value: '12.0' },
    ]
    const payload = buildSuctoActuarialPayload({
      data: sample,
      init: { account: { id: 5, country_id: 47 }, currency: { id: 26 } },
      partnerId: 99,
      actuarialTypeId: 1,
      vatIdByRate: buildVatIdByRate(vats),
      fallbackVatId: 9,
    })
    assert.equal(payload.partner_id, 99)
    assert.equal(payload.order_number, '2600128')
    assert.equal(payload.bank_number, '1234567891/0321')
    assert.equal((payload.lines as unknown[]).length, 1)
  })
})
