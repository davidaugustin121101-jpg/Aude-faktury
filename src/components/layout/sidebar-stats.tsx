'use client'

import { cn } from '@/lib/utils'
import { type AccountMode, SOLO_INVOICE_LIMIT } from '@/lib/account-mode'
import type { AccountingProvider } from '@/lib/accounting-connection'
import { Zap } from 'lucide-react'

const PROVIDER_NAMES: Record<AccountingProvider, string> = {
  idoklad: 'iDoklad',
  fakturoid: 'Fakturoid',
  superfaktura: 'SuperFaktura',
  bitfaktura: 'BitFaktura',
  sucto: 'Súčto',
}

export function SidebarStats({
  invoicesThisMonth,
  invoiceLimit,
  invoicesRemaining,
  creditsConsumed,
  connectedProvider,
}: {
  invoicesThisMonth: number
  invoiceLimit: number
  invoicesRemaining: number
  creditsConsumed: number
  connectedProvider: AccountingProvider | null
}) {
  const isUnlimited = invoiceLimit >= 999_999
  const creditPool = creditsConsumed + invoicesRemaining
  const usesCredits = !isUnlimited && creditPool > SOLO_INVOICE_LIMIT
  const usagePercent = isUnlimited
    ? 0
    : usesCredits
      ? Math.min(100, Math.round((creditsConsumed / Math.max(creditPool, 1)) * 100))
      : Math.min(100, Math.round((invoicesThisMonth / SOLO_INVOICE_LIMIT) * 100))

  return (
    <div className="mx-3 mb-2 space-y-2">
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            <Zap className="h-3 w-3" />
            Kredit
          </div>
          {!isUnlimited && (
            <span className="text-[10px] text-gray-400">
              {usesCredits
                ? `${creditsConsumed}/${creditPool} vytěženo`
                : `${invoicesThisMonth}/${SOLO_INVOICE_LIMIT} tento měsíc`}
            </span>
          )}
        </div>
        {isUnlimited ? (
          <p className="text-sm font-bold text-violet-700">Neomezeně</p>
        ) : (
          <>
            <p className="text-base font-bold text-gray-900 mb-1.5">
              {invoicesRemaining}
              <span className="text-xs font-normal text-gray-500 ml-1">zbývá</span>
            </p>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Fakturační systém</p>
        <p className="text-xs font-medium text-gray-800 truncate">
          {connectedProvider ? PROVIDER_NAMES[connectedProvider] : 'Nepřipojeno'}
        </p>
      </div>
    </div>
  )
}
