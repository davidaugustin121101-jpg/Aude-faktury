import { Building2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AccountMode } from '@/lib/account-mode'
import { MODE_LABELS } from '@/lib/account-mode'

const PROVIDER_NAMES = {
  idoklad: 'iDoklad',
  fakturoid: 'Fakturoid',
  superfaktura: 'SuperFaktura',
} as const

export function ModeBadge({
  mode,
  connectedProvider,
  workspaceName,
  className,
}: {
  mode: AccountMode
  connectedProvider?: keyof typeof PROVIDER_NAMES | null
  workspaceName?: string
  className?: string
}) {
  const isAccountant = mode === 'accountant'

  return (
    <div className={cn('mx-3 mb-2 px-3 py-2.5 rounded-xl border', className, isAccountant ? 'bg-violet-50 border-violet-100' : 'bg-emerald-50 border-emerald-100')}>
      <div className="flex items-center gap-2">
        {isAccountant ? (
          <Building2 className="h-3.5 w-3.5 text-violet-600 shrink-0" />
        ) : (
          <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        )}
        <span className={cn('text-xs font-semibold', isAccountant ? 'text-violet-800' : 'text-emerald-800')}>
          {MODE_LABELS[mode]}
        </span>
        {!isAccountant && (
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full ml-auto">
            zdarma
          </span>
        )}
      </div>
      {isAccountant && workspaceName && (
        <p className="text-[10px] text-violet-600 mt-1 truncate">Klient: {workspaceName}</p>
      )}
      {connectedProvider && (
        <p className="text-[10px] text-gray-500 mt-1">
          {PROVIDER_NAMES[connectedProvider]}
        </p>
      )}
    </div>
  )
}
