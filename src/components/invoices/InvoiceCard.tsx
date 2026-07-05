'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProcessedInvoice } from '@/types/invoices'
import { INVOICE_ACTIONABLE_STATUSES } from '@/types/invoices'
import { ConfidenceBadge } from './ConfidenceBadge'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import { getStatusDisplay } from '@/lib/invoice-status'
import { formatMoney } from '@/lib/invoice-totals'

interface InvoiceCardProps {
  invoice: ProcessedInvoice
  compact?: boolean
}

export function InvoiceCard({ invoice, compact }: InvoiceCardProps) {
  const display = getStatusDisplay(invoice.status)
  const needsAction = INVOICE_ACTIONABLE_STATUSES.includes(invoice.status)
  const currency = invoice.mena ?? 'CZK'

  const formattedAmount = invoice.castka_celkem
    ? formatMoney(invoice.castka_celkem, currency)
    : '—'

  const formattedDate = invoice.datum_splatnosti
    ? new Intl.DateTimeFormat('cs-CZ').format(new Date(invoice.datum_splatnosti))
    : null

  const amountDetail =
    invoice.castka_bez_dph != null || invoice.castka_dph != null
      ? `${formatMoney(invoice.castka_bez_dph, currency)} · DPH ${formatMoney(invoice.castka_dph, currency)}`
      : null

  return (
    <Link href={`/faktury/${invoice.id}`}>
      <div
        className={cn(
          'group flex items-center gap-4 px-4 bg-white rounded-xl border transition-all hover:shadow-md hover:border-blue-200',
          needsAction ? 'border-gray-200' : 'border-gray-100 opacity-90',
          compact ? 'py-3' : 'py-4'
        )}
      >
        <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', display.dot)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {invoice.dodavatel_nazev ?? 'Neznámý dodavatel'}
            </p>
            {invoice.status === 'needs_manual_check' && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {invoice.cislo_faktury ? `Č. ${invoice.cislo_faktury}` : ''}
            {invoice.cislo_faktury && formattedDate ? ' · ' : ''}
            {formattedDate ? `Splatnost ${formattedDate}` : ''}
          </p>
          {!compact && amountDetail && (
            <p className="text-[11px] text-gray-500 mt-1 truncate">{amountDetail}</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">{formattedAmount}</p>
          {!compact && (
            <ConfidenceBadge value={invoice.confidence} className="mt-1" />
          )}
        </div>

        <InvoiceStatusBadge status={invoice.status} className="hidden sm:inline-flex shrink-0" />
      </div>
    </Link>
  )
}
