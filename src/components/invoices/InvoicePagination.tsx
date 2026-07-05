import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  page: number
  totalPages: number
  statusFilter: string
}

export function InvoicePagination({ page, totalPages, statusFilter }: Props) {
  if (totalPages <= 1) return null

  const makeHref = (p: number) => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (p > 1) params.set('page', String(p))
    const q = params.toString()
    return q ? `/faktury?${q}` : '/faktury'
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-gray-500">
        Strana {page} z {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={makeHref(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            'text-sm px-3 py-1.5 rounded-lg border border-gray-200',
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
          )}
        >
          ← Předchozí
        </Link>
        <Link
          href={makeHref(page + 1)}
          aria-disabled={page >= totalPages}
          className={cn(
            'text-sm px-3 py-1.5 rounded-lg border border-gray-200',
            page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
          )}
        >
          Další →
        </Link>
      </div>
    </div>
  )
}
