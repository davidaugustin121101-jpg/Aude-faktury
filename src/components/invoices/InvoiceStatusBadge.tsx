import { cn } from '@/lib/utils'
import { getStatusDisplay } from '@/lib/invoice-status'

interface Props {
  status: string
  className?: string
  showBorder?: boolean
}

export function InvoiceStatusBadge({ status, className, showBorder = true }: Props) {
  const display = getStatusDisplay(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        showBorder && 'border',
        display.color,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', display.dot)} />
      {display.label}
    </span>
  )
}
