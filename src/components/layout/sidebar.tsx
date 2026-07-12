'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher'
import { ModeBadge } from '@/components/layout/mode-badge'
import { SidebarStats } from '@/components/layout/sidebar-stats'
import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import { MAIN_NAV, SETUP_NAV, SETTINGS_SUB_NAV } from '@/lib/nav-config'
import type { AccountMode } from '@/lib/account-mode'
import type { AccountingProvider } from '@/lib/accounting-connection'
import { LogOut, ChevronUp, type LucideIcon } from 'lucide-react'

interface SidebarProps {
  className?: string
  user: { email?: string }
  isAccountant: boolean
  hasActiveSubscription: boolean
  accountMode: AccountMode
  connectedProvider: AccountingProvider | null
  workspaceName: string
  invoicesThisMonth: number
  invoiceLimit: number
  invoicesRemaining: number
  creditsConsumed: number
  totalInvoices: number
}

function isNavActive(href: string, pathname: string): boolean {
  if (href === '/faktury') {
    return (
      pathname === '/faktury' ||
      (pathname.startsWith('/faktury/') && !pathname.startsWith('/faktury/upload'))
    )
  }
  if (href === '/settings') {
    return pathname === '/settings'
  }
  if (href === '/') {
    return pathname === '/'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({
  className,
  user,
  isAccountant,
  hasActiveSubscription,
  accountMode,
  connectedProvider,
  workspaceName,
  invoicesThisMonth,
  invoiceLimit,
  invoicesRemaining,
  creditsConsumed,
  totalInvoices,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut({ scope: 'global' })
    window.location.href = '/'
  }

  const initials = user.email?.[0].toUpperCase() ?? '?'
  const setupNav = SETUP_NAV.filter((item) => !item.accountantOnly || isAccountant)

  function NavLink({
    href,
    label,
    icon: Icon,
  }: {
    href: string
    label: string
    icon: LucideIcon
  }) {
    const active = isNavActive(href, pathname)
    return (
      <Link href={href}>
        <div
          className={cn(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            active
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-blue-600" />
          )}
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              active ? 'text-blue-600' : 'text-gray-400'
            )}
          />
          <span className="flex-1">{label}</span>
        </div>
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto',
        className
      )}
    >
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-gray-100 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
          <span className="text-xl" aria-hidden>
            🧾
          </span>
          <div className="min-w-0">
            <span className="font-bold text-gray-900 text-sm block truncate">{APP_NAME}</span>
            <p className="text-xs text-gray-400 leading-none truncate">{APP_TAGLINE}</p>
          </div>
        </Link>
      </div>

      <div className="pt-3 shrink-0">
        <ModeBadge
          mode={accountMode}
          connectedProvider={connectedProvider}
          workspaceName={isAccountant ? workspaceName : undefined}
        />
        {isAccountant && <WorkspaceSwitcher />}
      </div>

      <SidebarStats
        invoicesThisMonth={invoicesThisMonth}
        invoiceLimit={invoiceLimit}
        invoicesRemaining={invoicesRemaining}
        creditsConsumed={creditsConsumed}
        connectedProvider={connectedProvider}
      />

      <nav className="flex-1 px-3 py-2 space-y-4">
        <div>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Hlavní
          </p>
          <div className="space-y-0.5">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
        <div>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Další
          </p>
          <div className="space-y-0.5">
            {SETTINGS_SUB_NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            {setupNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      </nav>

      <Separator className="shrink-0" />

      <div className="p-3 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-[10px] text-gray-400">Můj účet</p>
            </div>
            <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>Nastavení</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings/predplatne')}>
              Předplatné
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Odhlásit se
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
