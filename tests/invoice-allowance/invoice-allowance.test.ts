import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getInvoicesRemaining, SOLO_INVOICE_LIMIT } from '../../src/lib/account-mode'

describe('invoice allowance accounting', () => {
  it('free tier remaining ignores deleted invoices when usage is tracked in ledger', () => {
    const profile = { plan: 'free', invoice_credits: 0, stripe_subscription_id: null }
    const usedFromLedger = 3
    assert.equal(getInvoicesRemaining(profile, usedFromLedger), SOLO_INVOICE_LIMIT - 3)
    // Po smazání faktury zůstane usedFromLedger stejné → slot se nevrátí
    assert.equal(getInvoicesRemaining(profile, usedFromLedger), SOLO_INVOICE_LIMIT - 3)
  })

  it('credit tier uses profile credits, not monthly invoice count', () => {
    const profile = { plan: 'free', invoice_credits: 5, stripe_subscription_id: null }
    assert.equal(getInvoicesRemaining(profile, 99), 5)
  })
})
