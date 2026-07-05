'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { InvoiceStatusFilter } from '@/lib/invoice-status'

const FILTERS: { id: InvoiceStatusFilter; label: string }[] = [
  { id: 'all', label: 'Vše' },
  { id: 'pending', label: 'Aktivní' },
  { id: 'approved', label: 'Odesláno' },
  { id: 'error', label: 'Chyba' },
]

export function InvoiceListFilters() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = (searchParams.get('status') as InvoiceStatusFilter) || 'all'

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ id, label }) => {
        const params = new URLSearchParams(searchParams.toString())
        if (id === 'all') {
          params.delete('status')
        } else {
          params.set('status', id)
        }
        const href = params.toString() ? `${pathname}?${params}` : pathname
        const isActive = active === id

        return (
          <Link
            key={id}
            href={href}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
