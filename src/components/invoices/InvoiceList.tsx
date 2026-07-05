import type { ProcessedInvoice } from '@/types/invoices'
import { InvoiceCard } from './InvoiceCard'

interface InvoiceListProps {
  invoices: ProcessedInvoice[]
  emptyMessage?: string
  compact?: boolean
}

export function InvoiceList({
  invoices,
  emptyMessage = 'Žádné faktury',
  compact,
}: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <InvoiceCard key={inv.id} invoice={inv} compact={compact} />
      ))}
    </div>
  )
}
