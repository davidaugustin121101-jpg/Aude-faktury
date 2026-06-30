'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-client'
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher'

const NAV = [
  { href: '/dashboard', label: 'Přehled', icon: '📊' },
  { href: '/dashboard/upload', label: 'Nahrát fakturu', icon: '📄' },
  { href: '/dashboard/queue', label: 'Fronta', icon: '📥' },
  { href: '/dashboard/history', label: 'Historie', icon: '📋' },
  { href: '/dashboard/clients', label: 'Klienti', icon: '👥' },
  { href: '/dashboard/settings', label: 'Nastavení', icon: '⚙️' },
  { href: '/dashboard/settings/accounting', label: 'Fakturační systém', icon: '🔗' },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard" className="font-bold text-lg">
          Audeflow Faktury
        </Link>
        <p className="text-gray-400 text-xs mt-1">faktury.audeflow.cz</p>
      </div>
      <WorkspaceSwitcher />
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2"
        >
          Odhlásit se
        </button>
      </div>
    </aside>
  )
}
