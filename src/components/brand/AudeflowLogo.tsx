import Image from 'next/image'
import { cn } from '@/lib/utils'

const LOGO_SRC = '/brand/audeflow-logo.png'

type Props = {
  className?: string
  height?: number
}

export function AudeflowLogo({ className, height = 26 }: Props) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Audeflow"
      width={Math.round(height * 2.4)}
      height={height}
      className={cn('w-auto h-[26px] sm:h-7 object-contain', className)}
      priority
    />
  )
}
