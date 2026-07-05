import {
  LayoutDashboard,
  Receipt,
  Settings,
  Link2,
  Users,
  CreditCard,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  accountantOnly?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Přehled', icon: LayoutDashboard },
  { href: '/faktury', label: 'Faktury', icon: Receipt },
  { href: '/faktury/upload', label: 'Nahrát', icon: Upload },
]

export const SETUP_NAV: NavItem[] = [
  { href: '/settings/accounting', label: 'Fakturační systém', icon: Link2 },
  { href: '/klienti', label: 'Klienti', icon: Users, accountantOnly: true },
  { href: '/settings/predplatne', label: 'Předplatné', icon: CreditCard },
  { href: '/settings', label: 'Nastavení', icon: Settings },
]
