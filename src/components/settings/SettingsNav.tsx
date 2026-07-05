'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/settings', label: 'Účet', exact: true },
  { href: '/settings/predplatne', label: 'Předplatné', exact: false },
  { href: '/settings/accounting', label: 'Fakturační systém', exact: false },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
      {TABS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
