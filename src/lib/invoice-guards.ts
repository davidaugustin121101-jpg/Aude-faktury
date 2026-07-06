export const INVOICE_PAGE_SIZE = 50

export const INVOICE_DELETABLE_STATUSES = [
  'pending_review',
  'needs_manual_check',
  'error',
  'rejected',
  'approved',
  'sent_to_accounting',
  'sent',
] as const

export const INVOICE_REJECTABLE_STATUSES = [
  'pending_review',
  'needs_manual_check',
  'error',
] as const

export const INVOICE_SEND_CLAIM_STATUSES = [
  'pending_review',
  'needs_manual_check',
  'error',
  'approved',
] as const
