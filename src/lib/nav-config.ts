import {
  LayoutDashboard,
  Receipt,
  Settings,
  Link2,
  Users,
  CreditCard,
  BookOpen,
  Download,
  Upload,
  Home,
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
  { href: '/napoveda', label: 'Nápověda', icon: BookOpen },
  { href: '/settings', label: 'Nastavení', icon: Settings },
]

export const SETUP_NAV: NavItem[] = [
  { href: '/klienti', label: 'Klienti', icon: Users, accountantOnly: true },
]

export const SETTINGS_TABS = [
  { href: '/settings', label: 'Účet', exact: true },
  { href: '/settings/accounting', label: 'Fakturační systém', exact: false },
  { href: '/settings/export', label: 'Export profil', exact: false },
  { href: '/settings/predplatne', label: 'Předplatné', exact: false },
] as const

export const SETTINGS_SUB_NAV: NavItem[] = [
  { href: '/', label: 'Úvod', icon: Home },
  { href: '/settings/accounting', label: 'Fakturační systém', icon: Link2 },
  { href: '/settings/export', label: 'Export profil', icon: Download },
  { href: '/settings/predplatne', label: 'Předplatné', icon: CreditCard },
  { href: '/faktury/upload', label: 'Nahrát fakturu', icon: Upload },
]
