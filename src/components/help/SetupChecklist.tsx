import Link from 'next/link'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SetupStatus = {
  countrySet: boolean
  exportProfileSet: boolean
  accountingConnected: boolean
}

type Props = {
  status: SetupStatus
  compact?: boolean
  showHelpLink?: boolean
}

const ITEMS = [
  {
    key: 'country' as const,
    label: 'Země účetnictví nastavena',
    href: '/settings',
    optional: false,
    done: (s: SetupStatus) => s.countrySet,
  },
  {
    key: 'export' as const,
    label: 'Export profil vyplněn (Pohoda / Money / Helios)',
    href: '/settings/export',
    optional: true,
    done: (s: SetupStatus) => s.exportProfileSet,
  },
  {
    key: 'accounting' as const,
    label: 'Fakturační systém napojen (iDoklad / Fakturoid / SuperFaktura)',
    href: '/settings/accounting',
    optional: true,
    done: (s: SetupStatus) => s.accountingConnected,
  },
]

export function SetupChecklist({ status, compact, showHelpLink = true }: Props) {
  const doneCount = ITEMS.filter((item) => item.done(status)).length

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Checklist nastavení</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {doneCount} z {ITEMS.length} hotovo
          </p>
        </div>
        {showHelpLink && (
          <Link href="/napoveda" className="text-xs text-blue-600 hover:underline font-medium">
            Nápověda →
          </Link>
        )}
      </div>
      <ul className="space-y-2">
        {ITEMS.map((item) => {
          const done = item.done(status)
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  done ? 'bg-emerald-50 text-emerald-900' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <span className="flex-1">
                  {item.label}
                  {item.optional && !done && (
                    <span className="text-xs text-gray-400 ml-1">(volitelné)</span>
                  )}
                </span>
                {!done && <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
