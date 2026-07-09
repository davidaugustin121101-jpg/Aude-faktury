import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildBitFakturaInvoicePayload,
  normalizeBitFakturaDomain,
  bitfakturaBaseUrl,
} from '../../src/lib/bitfaktura.ts'
import { pickVatId, buildSuctoActuarialPayload } from '../../src/lib/sucto.ts'
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
  polozky: [],
}

describe('bitfaktura', () => {
  it('normalizes domain', () => {
    assert.equal(normalizeBitFakturaDomain('https://mojefirma.bitfaktura.cz/'), 'mojefirma')
    assert.equal(bitfakturaBaseUrl('mojefirma'), 'https://mojefirma.bitfaktura.cz')
  })

  it('builds expense invoice payload', () => {
    const payload = buildBitFakturaInvoicePayload(sample)
    assert.equal(payload.income, '0')
    assert.equal(payload.accounting_kind, 'expenses')
    assert.equal(payload.seller_name, 'Dodavatel s.r.o.')
    assert.equal(payload.currency, 'CZK')
    assert.ok(Array.isArray(payload.positions))
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

  it('builds actuarial payload', () => {
    const payload = buildSuctoActuarialPayload({
      data: sample,
      init: { account: { id: 5, country_id: 47 }, currency: { id: 26 } },
      partnerId: 99,
      actuarialTypeId: 1,
      vatId: 9,
    })
    assert.equal(payload.partner_id, 99)
    assert.equal(payload.external_number, '2026/001')
    assert.equal((payload.lines as { vat_id: number }[])[0].vat_id, 9)
  })
})
