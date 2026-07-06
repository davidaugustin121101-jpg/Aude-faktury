import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildPredkontace } from '../../src/lib/predkontace'

describe('predkontace', () => {
  it('builds full MD/Dal lines for standard VAT invoice', () => {
    const result = buildPredkontace({
      ucetni_kod: '504',
      castka_bez_dph: 160,
      castka_dph: 33.6,
      castka_celkem: 193.6,
      mena: 'CZK',
    })

    assert.ok(result)
    assert.equal(result.naklad, '504')
    assert.equal(result.dph, '343')
    assert.equal(result.dodavatel, '321')
    assert.equal(result.display, '504 / 343 / 321')
    assert.equal(result.lines.length, 3)
    assert.equal(result.lines[0]?.side, 'md')
    assert.equal(result.lines[2]?.side, 'dal')
    assert.equal(result.lines[2]?.amount, 193.6)
    assert.ok(result.comment.includes('Předkontace: 504 / 343 / 321'))
  })

  it('omits DPH account for reverse charge', () => {
    const result = buildPredkontace({
      ucetni_kod: '518',
      castka_bez_dph: 1000,
      castka_dph: 0,
      castka_celkem: 1000,
      je_prenesena_dan: true,
    })

    assert.ok(result)
    assert.equal(result.dph, null)
    assert.equal(result.display, '518 / 321')
    assert.equal(result.lines.length, 2)
  })

  it('returns null without expense account', () => {
    assert.equal(buildPredkontace({ ucetni_kod: '' }), null)
    assert.equal(buildPredkontace({ ucetni_kod: null }), null)
  })
})
