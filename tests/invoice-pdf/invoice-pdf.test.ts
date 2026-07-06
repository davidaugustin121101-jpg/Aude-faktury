import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SUPERFAKTURA_MAX_ATTACHMENT_BYTES,
  buildInvoicePdfStoragePath,
  canAttachToSuperFaktura,
  resolveInvoicePdfFilename,
} from '../../src/lib/invoice-pdf-storage'

describe('invoice-pdf-storage', () => {
  it('builds stable storage path per user and invoice', () => {
    assert.equal(
      buildInvoicePdfStoragePath('user-1', 'inv-1'),
      'user-1/inv-1.pdf'
    )
  })

  it('resolves pdf filename with fallback', () => {
    assert.equal(resolveInvoicePdfFilename('faktura.pdf'), 'faktura.pdf')
    assert.equal(resolveInvoicePdfFilename('scan'), 'scan.pdf')
    assert.equal(resolveInvoicePdfFilename(null), 'faktura.pdf')
  })

  it('respects SuperFaktura 4 MB attachment limit', () => {
    assert.equal(canAttachToSuperFaktura(1024), true)
    assert.equal(canAttachToSuperFaktura(SUPERFAKTURA_MAX_ATTACHMENT_BYTES), true)
    assert.equal(canAttachToSuperFaktura(SUPERFAKTURA_MAX_ATTACHMENT_BYTES + 1), false)
    assert.equal(canAttachToSuperFaktura(0), false)
  })
})
