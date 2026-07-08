import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { reconcileExtractionAmounts, sumAmountsFromPolozky } from '../../src/lib/invoice-amounts'
import { buildPredkontaceFromExtracted } from '../../src/lib/predkontace'

describe('invoice-amounts', () => {
  it('reconciles zero header from line items on advance settlement', () => {
    const data = reconcileExtractionAmounts({
      dodavatel_nazev: 'Expedo',
      dodavatel_ico: '04527542',
      dodavatel_dic: 'CZ04527542',
      cislo_faktury: '242712882',
      datum_vystaveni: '2024-06-03',
      datum_splatnosti: '2024-06-17',
      variabilni_symbol: '242712882',
      castka_bez_dph: 0,
      sazba_dph: 21,
      castka_dph: 0,
      castka_celkem: 0,
      castka_k_uhrade: 0,
      mena: 'CZK',
      popis_plneni: 'Stůl',
      iban: null,
      ucetni_kod: '501',
      ucetni_kod_nazev: 'Materiál',
      ucetni_kod_duvod: 'test',
      ucetni_kod_confidence: 0.85,
      confidence: 0.85,
      problemy: [],
      typ_faktury: 'danovy_doklad',
      typ_dokladu: 'faktura',
      je_prenesena_dan: false,
      polozky: [
        {
          nazev: 'Herní stůl',
          mnozstvi: 1,
          jednotkova_cena: 1892.56,
          sazba_dph: 21,
          typ: 'zbozi',
        },
      ],
    })

    assert.equal(data.castka_celkem, 2290.0)
    assert.equal(data.castka_bez_dph, 1892.56)
    assert.ok(data.problemy.some((p) => p.includes('vyúčtování zálohy')))
  })

  it('sums polozky correctly', () => {
    const sum = sumAmountsFromPolozky({
      dodavatel_nazev: 'A',
      dodavatel_ico: '12345678',
      dodavatel_dic: null,
      cislo_faktury: '1',
      datum_vystaveni: '2024-01-01',
      datum_splatnosti: '2024-01-15',
      variabilni_symbol: '1',
      castka_bez_dph: 0,
      sazba_dph: 21,
      castka_dph: 0,
      castka_celkem: 0,
      mena: 'CZK',
      popis_plneni: 'x',
      iban: null,
      ucetni_kod: '518',
      ucetni_kod_nazev: 'x',
      ucetni_kod_duvod: 'x',
      ucetni_kod_confidence: 1,
      confidence: 1,
      problemy: [],
      polozky: [
        { nazev: 'Služba', mnozstvi: 2, jednotkova_cena: 100, sazba_dph: 21, typ: 'sluzba' },
      ],
    })
    assert.equal(sum?.castka_bez_dph, 200)
    assert.equal(sum?.castka_dph, 42)
    assert.equal(sum?.castka_celkem, 242)
  })
})

describe('predkontace zalohova', () => {
  it('uses 314/315/321 for advance invoice', () => {
    const result = buildPredkontaceFromExtracted({
      dodavatel_nazev: 'A',
      dodavatel_ico: '12345678',
      dodavatel_dic: null,
      cislo_faktury: 'Z1',
      datum_vystaveni: '2024-01-01',
      datum_splatnosti: '2024-01-15',
      variabilni_symbol: 'Z1',
      castka_bez_dph: 1000,
      sazba_dph: 21,
      castka_dph: 210,
      castka_celkem: 1210,
      mena: 'CZK',
      popis_plneni: 'záloha',
      iban: null,
      ucetni_kod: '518',
      ucetni_kod_nazev: 'x',
      ucetni_kod_duvod: 'x',
      ucetni_kod_confidence: 1,
      confidence: 1,
      problemy: [],
      typ_faktury: 'zalohova',
      typ_dokladu: 'proforma',
      je_prenesena_dan: false,
      polozky: [],
    })

    assert.ok(result)
    assert.equal(result.display, '314 / 315 / 321')
  })
})
