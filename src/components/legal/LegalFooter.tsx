import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LEGAL_EMAIL, LEGAL_ENTITY, LEGAL_ICO } from '@/lib/legal'

type Props = {
  className?: string
  compact?: boolean
}

export function LegalFooter({ className, compact }: Props) {
  return (
    <div className={cn('text-xs text-gray-500 space-y-2', className)}>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/obchodni-podminky" className="hover:text-blue-600 underline-offset-2 hover:underline">
          Obchodní podmínky
        </Link>
        <Link href="/gdpr" className="hover:text-blue-600 underline-offset-2 hover:underline">
          GDPR
        </Link>
        {!compact && (
          <a href={`mailto:${LEGAL_EMAIL}`} className="hover:text-blue-600 underline-offset-2 hover:underline">
            {LEGAL_EMAIL}
          </a>
        )}
      </div>
      <p>
        © 2026 {LEGAL_ENTITY} · IČO {LEGAL_ICO}
      </p>
    </div>
  )
}
