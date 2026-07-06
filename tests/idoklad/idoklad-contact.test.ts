import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  IDOKLAD_COUNTRY_CZ,
  IDOKLAD_COUNTRY_SK,
  buildIdokladContactPayload,
  buildStreetFromAresSidlo,
  inferIdokladCountryId,
} from '../../src/lib/idoklad-contact'

describe('idoklad-contact', () => {
  it('maps iDoklad country ids correctly (2=CZ, 1=SK)', () => {
    assert.equal(IDOKLAD_COUNTRY_CZ, 2)
    assert.equal(IDOKLAD_COUNTRY_SK, 1)
    assert.equal(inferIdokladCountryId({ dodavatel_dic: 'CZ123' }), 2)
    assert.equal(inferIdokladCountryId({ dodavatel_dic: 'SK123' }), 1)
    assert.equal(inferIdokladCountryId({ dodavatel_dic: null }), 2)
  })

  it('builds street from ARES sidlo', () => {
    assert.equal(
      buildStreetFromAresSidlo({
        nazevUlice: 'Budějovická',
        cisloDomovni: 778,
        cisloOrientacni: 3,
        cisloOrientacniPismeno: 'a',
      }),
      'Budějovická 778/3a'
    )
  })

  it('includes ARES address in contact payload for CZ supplier', () => {
    const payload = buildIdokladContactPayload(
      {
        dodavatel_nazev: 'Test s.r.o.',
        dodavatel_ico: '12345678',
        dodavatel_dic: 'CZ12345678',
      } as never,
      {
        ares: {
          sidlo: {
            kodStatu: 'CZ',
            nazevUlice: 'Hlavní',
            cisloDomovni: 1,
            nazevObce: 'Praha',
            psc: 11000,
          },
        },
      }
    )

    assert.equal(payload.CountryId, 2)
    assert.equal(payload.Street, 'Hlavní 1')
    assert.equal(payload.City, 'Praha')
    assert.equal(payload.PostalCode, '11000')
  })
})
