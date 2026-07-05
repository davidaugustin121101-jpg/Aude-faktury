'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SETTINGS_TABS } from '@/lib/nav-config'

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl w-fit max-w-full">
      {SETTINGS_TABS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
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
