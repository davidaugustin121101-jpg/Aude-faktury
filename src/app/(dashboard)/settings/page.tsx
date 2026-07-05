import { createClient } from '@/lib/supabase/server'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Receipt, CreditCard } from 'lucide-react'
import { CountrySelector } from '@/components/settings/CountrySelector'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { APP_NAME } from '@/lib/brand'
import {
  getAccountMode,
  getInvoiceLimit,
  getPlanLabel,
  MODE_LABELS,
  hasActiveAccountantSubscription,
} from '@/lib/account-mode'
import type { CountryCode } from '@/lib/accounting-codes'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, is_accountant, stripe_subscription_id, country')
    .eq('id', user.id)
    .maybeSingle()

  const accountMode = getAccountMode(profile)
  const isAccountant = hasActiveAccountantSubscription(profile)
  const invoiceLimit = getInvoiceLimit(profile)
  const planLabel = getPlanLabel(profile)
  const country = ((profile as { country?: string } | null)?.country ?? 'cz') as CountryCode

  const { count } = await supabase
    .from('processed_invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
          <p className="text-sm text-gray-500 mt-1">Správa účtu a napojení</p>
        </div>
        <SettingsNav />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Účet</p>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">E-mail</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Režim</p>
              <Badge
                variant="secondary"
                className={
                  isAccountant
                    ? 'text-violet-700 bg-violet-50 border-violet-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }
              >
                {MODE_LABELS[accountMode]}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Tarif</p>
              <p className="font-medium text-gray-900">{planLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Limit faktur</p>
              <p className="font-medium text-gray-900">
                {invoiceLimit >= 999_999 ? 'Neomezeně' : `${invoiceLimit} / měsíc`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Faktur tento měsíc</p>
              <p className="font-medium text-gray-900">{count ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/settings/predplatne"
        className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-violet-50 border border-gray-200 hover:border-violet-300 rounded-xl p-4 transition-all group"
      >
        <div className="h-9 w-9 rounded-lg bg-violet-600 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Předplatné</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Solo zdarma · Účetní režim 299 Kč/měsíc
          </p>
        </div>
        <span className="text-xs text-violet-600 font-medium group-hover:underline">Zobrazit →</span>
      </Link>

      <CountrySelector initialCountry={country} />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Napojení</p>
        {isAccountant && (
          <Link
            href="/klienti"
            className="flex items-center gap-4 bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 rounded-xl p-4 transition-all group"
          >
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <span className="text-lg">👥</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Klienti</p>
              <p className="text-xs text-gray-500 mt-0.5">Správa firem — každý vlastní fakturační systém</p>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-violet-600">→</span>
          </Link>
        )}
        <Link
          href="/settings/accounting"
          className="flex items-center gap-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl p-4 transition-all group"
        >
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Fakturační systém</p>
            <p className="text-xs text-gray-500 mt-0.5">Jeden systém — iDoklad, Fakturoid nebo SuperFaktura</p>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-blue-600">→</span>
        </Link>
      </div>

      <Separator />

      <div className="text-xs text-gray-400 space-y-1">
        <p>
          {APP_NAME} ·{' '}
          <a href="https://audeflow.cz" className="underline">
            audeflow.cz
          </a>
        </p>
        <p>
          Podpora:{' '}
          <a href="mailto:podpora@audeflow.cz" className="underline">
            podpora@audeflow.cz
          </a>
        </p>
      </div>
    </div>
  )
}
