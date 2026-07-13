import { cn } from '@/lib/utils'
import { AudeflowLogo } from '@/components/brand/AudeflowLogo'

type Props = {
  className?: string
}

export function AudeflowBrand({ className }: Props) {
  return (
    <span className={cn('flex items-center gap-2 min-w-0', className)}>
      <AudeflowLogo />
      <span className="font-semibold tracking-[0.06em] text-gray-900 truncate text-sm sm:text-base">
        AUDE <span className="text-blue-600">FLOW</span>
      </span>
    </span>
  )
}
