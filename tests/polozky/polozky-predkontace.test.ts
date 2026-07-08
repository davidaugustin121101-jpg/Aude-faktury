import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { applyPolozkyToExtraction, buildSplitPredkontaceFromExtracted } from '../../src/lib/polozky-predkontace'
import type { ExtractedInvoiceData } from '../../src/lib/claude'

const base: ExtractedInvoiceData = {
  dodavatel_nazev: 'Test',
  dodavatel_ico: '12345678',
  dodavatel_dic: 'CZ12345678',
  cislo_faktury: '2024-001',
  datum_vystaveni: '2024-06-01',
  datum_splatnosti: '2024-06-15',
  variabilni_symbol: '2024001',
  castka_bez_dph: 1000,
  sazba_dph: 21,
  castka_dph: 210,
  castka_celkem: 1210,
  mena: 'CZK',
  popis_plneni: 'Test',
  iban: null,
  ucetni_kod: '518',
  ucetni_kod_nazev: 'Služby',
  ucetni_kod_duvod: 'test',
  ucetni_kod_confidence: 0.8,
  confidence: 0.9,
  problemy: [],
  typ_dokladu: 'faktura',
  typ_faktury: 'danovy_doklad',
  je_prenesena_dan: false,
  polozky: [],
}

describe('polozky-predkontace', () => {
  it('suggests split predkontace for mixed goods and services', () => {
    const data = applyPolozkyToExtraction({
      ...base,
      polozky: [
        {
          nazev: 'Tonery',
          mnozstvi: 2,
          jednotkova_cena: 200,
          sazba_dph: 21,
          typ: 'zbozi',
        },
        {
          nazev: 'Poradenství',
          mnozstvi: 1,
          jednotkova_cena: 600,
          sazba_dph: 21,
          typ: 'sluzba',
        },
      ],
    })

    assert.equal(data.ucetni_kod_nazev, 'Smíšené položky')
    const split = buildSplitPredkontaceFromExtracted(data)
    assert.ok(split)
    assert.ok(split!.length >= 2)
  })
})
