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

describe('bitfaktura', () => {
  it('normalizes domain', () => {
    assert.equal(normalizeBitFakturaDomain('https://mojefirma.bitfaktura.cz/'), 'mojefirma')
    assert.equal(bitfakturaBaseUrl('mojefirma'), 'https://mojefirma.bitfaktura.cz')
  })

  it('builds expense invoice payload with bank and symbols', () => {
    const payload = buildBitFakturaInvoicePayload(sample)
    assert.equal(payload.income, '0')
    assert.equal(payload.seller_bank_account, '1234567891/0321')
    assert.equal(payload.constant_symbol, '308')
    assert.equal(payload.order_number, '2600128')
    assert.equal((payload.positions as unknown[]).length, 1)
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
})

describe('fakturoid payload', () => {
  it('maps multiple lines and DUZP', () => {
    const payload = buildFakturoidExpensePayload(sample)
    assert.equal(payload.taxable_fulfillment_due, '2026-07-01')
    assert.equal(payload.lines.length, 1)
    assert.match(payload.note ?? '', /KS: 308/)
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
