import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  IDOKLAD_ATTACHMENT_RECEIVED_INVOICE_TYPE,
  buildIdokladAttachmentPath,
} from '../../src/lib/idoklad'

describe('idoklad attachment', () => {
  it('uses ReceivedInvoice document type 5 for attachments API', () => {
    assert.equal(IDOKLAD_ATTACHMENT_RECEIVED_INVOICE_TYPE, 5)
    assert.equal(buildIdokladAttachmentPath(12345), 'Attachments/12345/5')
  })
})
