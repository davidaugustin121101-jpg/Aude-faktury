'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/brand'

const NAV_LINKS = [
  { href: '#video', label: 'Ukázka' },
  { href: '#jak-funguje', label: 'Jak to funguje' },
  { href: '#pricing', label: 'Ceník' },
]

interface Props {
  isAuthenticated?: boolean
}

export function LandingHeader({ isAuthenticated = false }: Props) {
  const [open, setOpen] = useState(false)

  const authButtons = isAuthenticated ? (
    <>
      <Link href="/faktury/upload">
        <Button variant="ghost" size="sm">
          Nahrát fakturu
        </Button>
      </Link>
      <Link href="/dashboard">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          Přejít do aplikace
        </Button>
      </Link>
    </>
  ) : (
    <>
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Přihlásit se
        </Button>
      </Link>
      <Link href="/register">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          Registrovat zdarma
        </Button>
      </Link>
    </>
  )

  const mobileAuthButtons = isAuthenticated ? (
    <div className="flex flex-col gap-2 pt-2">
      <Link href="/dashboard" onClick={() => setOpen(false)}>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">Přejít do aplikace</Button>
      </Link>
      <Link href="/faktury/upload" onClick={() => setOpen(false)}>
        <Button variant="outline" className="w-full">
          Nahrát fakturu
        </Button>
      </Link>
    </div>
  ) : (
    <div className="flex flex-col gap-2 pt-2">
      <Link href="/login" onClick={() => setOpen(false)}>
        <Button variant="outline" className="w-full">
          Přihlásit se
        </Button>
      </Link>
      <Link href="/register" onClick={() => setOpen(false)}>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">Registrovat zdarma</Button>
      </Link>
    </div>
  )

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 safe-top">
      <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0" aria-hidden>
            🧾
          </span>
          <span className="font-bold text-gray-900 truncate text-sm sm:text-base">{APP_NAME}</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
            >
              {link.label}
            </a>
          ))}
          {authButtons}
        </nav>

        <button
          type="button"
          className="sm:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Zavřít menu' : 'Otevřít menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-gray-700 py-2"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {mobileAuthButtons}
        </div>
      )}
    </header>
  )
}
