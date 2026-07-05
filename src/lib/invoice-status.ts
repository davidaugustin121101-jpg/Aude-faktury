import type { InvoiceStatus } from '@/types/invoices'

export type InvoiceStatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'error'

export type StatusDisplay = {
  label: string
  shortLabel: string
  color: string
  dot: string
  filter: InvoiceStatusFilter
}

const DISPLAY: Record<string, StatusDisplay> = {
  pending_review: {
    label: 'Vytěženo',
    shortLabel: 'Vytěženo',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
    filter: 'pending',
  },
  needs_manual_check: {
    label: 'Vyžaduje kontrolu',
    shortLabel: 'Vyžaduje kontrolu',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    filter: 'pending',
  },
  sent_to_accounting: {
    label: 'Odesláno',
    shortLabel: 'Odesláno',
    color: 'text-green-700 bg-green-50 border-green-200',
    dot: 'bg-green-500',
    filter: 'approved',
  },
  sent: {
    label: 'Odesláno',
    shortLabel: 'Odesláno',
    color: 'text-green-700 bg-green-50 border-green-200',
    dot: 'bg-green-500',
    filter: 'approved',
  },
  approved: {
    label: 'Odesláno',
    shortLabel: 'Odesláno',
    color: 'text-green-700 bg-green-50 border-green-200',
    dot: 'bg-green-500',
    filter: 'approved',
  },
  rejected: {
    label: 'Zrušeno',
    shortLabel: 'Zrušeno',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
    filter: 'rejected',
  },
  error: {
    label: 'Chyba odeslání',
    shortLabel: 'Chyba odeslání',
    color: 'text-red-700 bg-red-50 border-red-200',
    dot: 'bg-red-500',
    filter: 'error',
  },
}

const FALLBACK: StatusDisplay = {
  label: 'Neznámý stav',
  shortLabel: 'Neznámý',
  color: 'text-gray-600 bg-gray-50 border-gray-200',
  dot: 'bg-gray-400',
  filter: 'all',
}

export function normalizeInvoiceStatus(status: string): InvoiceStatus | string {
  if (status === 'sent') return 'sent_to_accounting'
  return status
}

export function getStatusDisplay(status: string): StatusDisplay {
  return DISPLAY[status] ?? FALLBACK
}

export function matchesStatusFilter(status: string, filter: InvoiceStatusFilter): boolean {
  if (filter === 'all') return true
  return getStatusDisplay(status).filter === filter
}

export const APPROVED_STATUSES = ['sent_to_accounting', 'sent', 'approved'] as const
export const PENDING_STATUSES = ['pending_review', 'needs_manual_check'] as const

export function isApprovedStatus(status: string): boolean {
  return (APPROVED_STATUSES as readonly string[]).includes(status)
}
