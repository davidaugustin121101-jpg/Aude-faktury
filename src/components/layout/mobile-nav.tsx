'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/brand'
import { MAIN_NAV, SETUP_NAV, SETTINGS_SUB_NAV } from '@/lib/nav-config'
import type { AccountMode } from '@/lib/account-mode'
import type { AccountingProvider } from '@/lib/accounting-connection'
import { ModeBadge } from '@/components/layout/mode-badge'
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher'
import { LogOut, Menu, X } from 'lucide-react'

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

interface MobileNavProps {
  userEmail?: string
  isAccountant: boolean
  accountMode: AccountMode
  connectedProvider: AccountingProvider | null
  workspaceName: string
}

export function MobileTopBar({
  onMenuOpen,
  workspaceName,
  isAccountant,
}: {
  onMenuOpen: () => void
  workspaceName: string
  isAccountant: boolean
}) {
  return (
    <header className="lg:hidden shrink-0 h-14 border-b border-gray-200 bg-white flex items-center gap-3 px-4 safe-top">
      <button
        type="button"
        onClick={onMenuOpen}
        className="h-10 w-10 -ml-1 flex items-center justify-center rounded-lg hover:bg-gray-100"
        aria-label="Otevřít menu"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{APP_NAME}</p>
        {isAccountant && (
          <p className="text-[10px] text-gray-500 truncate">{workspaceName}</p>
        )}
      </div>
      <span className="text-xl" aria-hidden>
        🧾
      </span>
    </header>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur safe-bottom"
      aria-label="Hlavní navigace"
    >
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {MAIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0 px-1',
                active ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-blue-600')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function MobileDrawer({
  open,
  onClose,
  userEmail,
  isAccountant,
  accountMode,
  connectedProvider,
  workspaceName,
}: MobileNavProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  async function handleSignOut() {
    await supabase.auth.signOut({ scope: 'global' })
    window.location.href = '/'
  }

  function NavLink({ href, label }: { href: string; label: string }) {
    const active = isNavActive(href, pathname)
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'block px-4 py-3 text-sm font-medium rounded-xl',
          active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
        )}
      >
        {label}
      </Link>
    )
  }

  const setupItems = SETUP_NAV.filter((item) => !item.accountantOnly || isAccountant)

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Zavřít menu"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 w-[min(100%,20rem)] bg-white shadow-xl flex flex-col safe-top safe-bottom">
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
          <Link href="/" onClick={onClose} className="font-bold text-gray-900 hover:text-blue-600">
            {APP_NAME}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="Zavřít"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <ModeBadge
            mode={accountMode}
            connectedProvider={connectedProvider}
            workspaceName={isAccountant ? workspaceName : undefined}
          />
          {isAccountant && <WorkspaceSwitcher />}

          <div>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Hlavní
            </p>
            <div className="space-y-0.5">
              {MAIN_NAV.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </div>

          <div>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Nastavení
            </p>
            <div className="space-y-0.5">
              {SETTINGS_SUB_NAV.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
              {setupItems.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate mb-2">{userEmail}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-red-600 font-medium w-full px-2 py-2 rounded-lg hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Odhlásit se
          </button>
        </div>
      </aside>
    </div>
  )
}

export function MobileNavProvider(props: MobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <>
      <MobileTopBar
        onMenuOpen={() => setDrawerOpen(true)}
        workspaceName={props.workspaceName}
        isAccountant={props.isAccountant}
      />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...props} />
      <MobileBottomNav />
    </>
  )
}
