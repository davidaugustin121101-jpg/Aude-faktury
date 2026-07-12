import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { SubscriptionPlans } from '@/components/billing/SubscriptionPlans'
import { SubscriptionBillingFeedback } from '@/components/billing/SubscriptionBillingFeedback'
import { isStripeConfigured } from '@/lib/plans'
import {
  getEffectivePlan,
  getInvoiceLimit,
  hasActiveBaseSubscription,
  hasActiveMultiClientModule,
} from '@/lib/account-mode'
import { countMonthlyUsageFromLedger } from '@/lib/invoice-allowance'

export default async function PredplatnePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select(
      'plan, invoice_credits, is_accountant, stripe_subscription_id, stripe_addon_subscription_id, stripe_customer_id'
    )
    .eq('id', user.id)
    .maybeSingle()

  const currentPlan = getEffectivePlan(profile)
  const hasActiveSub = hasActiveBaseSubscription(profile)
  const hasMultiClient = hasActiveMultiClientModule(profile)
  const invoiceLimit = getInvoiceLimit(profile)
  const extractedThisMonth = await countMonthlyUsageFromLedger(user.id)

  return (
    <div className="space-y-8 max-w-5xl">
      <Suspense fallback={null}>
        <SubscriptionBillingFeedback />
      </Suspense>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Předplatné</h1>
          <p className="text-sm text-gray-500 mt-1">
            Základní tarif (Solo / Standard / Pro) určuje počet faktur. Modul více klientů (+299 Kč)
            lze dokoupit k placenému tarifu.
          </p>
        </div>
        <SettingsNav />
      </div>

      <SubscriptionPlans
        currentPlan={currentPlan}
        hasMultiClient={hasMultiClient}
        hasActiveSubscription={hasActiveSub}
        profile={profile ?? {}}
        invoicesThisMonth={extractedThisMonth}
        invoiceLimit={invoiceLimit}
        stripeConfigured={isStripeConfigured()}
        hasStripeCustomer={!!profile?.stripe_customer_id}
      />
    </div>
  )
}
