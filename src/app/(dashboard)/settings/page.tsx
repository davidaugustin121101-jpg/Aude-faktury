import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { LegalFooter } from '@/components/legal/LegalFooter'
import { APP_NAME } from '@/lib/brand'
import {
  getAccountMode,
  getInvoiceCredits,
  getInvoiceLimitLabel,
  getPlanLabel,
  hasActiveProSubscription,
  MODE_LABELS,
  hasActiveAccountantSubscription,
} from '@/lib/account-mode'
import {
  countCreditUsageFromLedger,
  countMonthlyUsageFromLedger,
} from '@/lib/invoice-allowance'
import { InvoiceSettingsPanel } from '@/components/settings/InvoiceSettingsPanel'
import { InboundEmailPanel } from '@/components/settings/InboundEmailPanel'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, invoice_credits, is_accountant, stripe_subscription_id, stripe_addon_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  const accountMode = getAccountMode(profile)
  const isAccountant = hasActiveAccountantSubscription(profile)
  const invoiceLimitLabel = getInvoiceLimitLabel(profile)
  const planLabel = getPlanLabel(profile)
  const credits = getInvoiceCredits(profile)
  const isPro = hasActiveProSubscription(profile)
  const extractedThisMonth = await countMonthlyUsageFromLedger(user.id)
  const creditsConsumed = isPro ? 0 : await countCreditUsageFromLedger(user.id)

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
          <p className="text-sm text-gray-500 mt-1">Správa účtu</p>
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
              <p className="font-medium text-gray-900">{invoiceLimitLabel}</p>
            </div>
            {credits > 0 ? (
              <>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Zbývá kreditů</p>
                  <p className="font-medium text-gray-900">{credits}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Vytěženo celkem</p>
                  <p className="font-medium text-gray-900">{creditsConsumed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Vytěženo tento měsíc</p>
                  <p className="font-medium text-gray-900">{extractedThisMonth}</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">
                  {isPro ? 'Faktur tento měsíc' : 'Faktur tento měsíc (Solo)'}
                </p>
                <p className="font-medium text-gray-900">{extractedThisMonth}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <InboundEmailPanel />

      <InvoiceSettingsPanel />

      <Separator />

      <div className="text-xs text-gray-400 space-y-3">
        <p>
          {APP_NAME} ·{' '}
          <a href="https://audeflow.cz" className="underline">
            audeflow.cz
          </a>
        </p>
        <LegalFooter />
      </div>
    </div>
  )
}
