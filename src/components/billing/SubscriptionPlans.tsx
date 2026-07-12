'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Settings2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  BILLING_TIERS,
  MULTI_CLIENT_ADDON,
  getInvoiceCredits,
  getPlanLabel,
  hasActiveProSubscription,
  hasPaidAccess,
  type BillingPlan,
  type UserBillingProfile,
} from '@/lib/account-mode'

interface Props {
  currentPlan: BillingPlan
  hasMultiClient: boolean
  hasActiveSubscription: boolean
  profile: UserBillingProfile
  invoicesThisMonth: number
  invoiceLimit: number
  stripeConfigured: boolean
  hasStripeCustomer: boolean
}

function SyncSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/sync', { method: 'POST' })
      const data = await res.json()
      if (data.activated) {
        toast.success('Předplatné synchronizováno!')
        window.location.reload()
      } else if (data.pending) {
        toast.info('Platba se stále zpracovává (bankovní převod). Zkuste znovu později.')
      } else {
        toast.error(data.error ?? 'Aktivní předplatné ve Stripe nenalezeno.')
      }
    } catch {
      toast.error('Synchronizace selhala')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div>
        <p className="text-sm font-medium text-amber-900">Zaplatili jste, ale tarif se neaktivoval?</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleSync} disabled={loading} className="shrink-0 ml-3">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Synchronizovat'}
      </Button>
    </div>
  )
}

export function SubscriptionPlans({
  currentPlan,
  hasMultiClient,
  hasActiveSubscription,
  profile,
  invoicesThisMonth,
  invoiceLimit,
  stripeConfigured,
  hasStripeCustomer,
}: Props) {
  const planLabel = getPlanLabel(profile)
  const credits = getInvoiceCredits(profile)
  const hasPro = hasActiveProSubscription(profile)
  const isUnlimited = hasPro

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'border rounded-xl p-4 text-sm',
          hasPaidAccess(profile)
            ? 'bg-violet-50 border-violet-100 text-violet-900'
            : 'bg-emerald-50 border-emerald-100 text-emerald-900'
        )}
      >
        <p className="font-medium">Aktuální tarif: {planLabel}</p>
        <p className="mt-0.5 opacity-80">
          {hasPro
            ? `Neomezeně faktur${hasMultiClient ? ' · modul více klientů aktivní' : ''}`
            : credits > 0
              ? `${credits} kreditů zbývá · ${invoicesThisMonth} vytěženo tento měsíc${hasMultiClient ? ' · modul více klientů' : ''}`
              : `Solo · ${invoicesThisMonth} / ${invoiceLimit} vytěženo tento měsíc`}
        </p>
      </div>

      {(hasPro || hasMultiClient) && hasStripeCustomer && stripeConfigured && (
        <ManageSubscriptionButton />
      )}

      {stripeConfigured && <SyncSubscriptionButton />}

      {!stripeConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <p className="font-medium">Stripe není nakonfigurován</p>
          <p className="text-amber-800 mt-1">
            Nastavte <code className="text-xs bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code>,{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">STRIPE_PRICE_STARTER</code>,{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">STRIPE_PRICE_PRO</code>,{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">STRIPE_PRICE_MULTI_CLIENT</code>.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Základní tarif (objem faktur)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {BILLING_TIERS.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              isCurrent={
                tier.id === 'free'
                  ? currentPlan === 'free' && credits === 0
                  : tier.id === 'pro'
                    ? hasPro
                    : false
              }
              hasPro={hasPro}
              stripeConfigured={stripeConfigured}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Doplňkový modul</h2>
        <p className="text-xs text-gray-500 mb-3">
          Vyžaduje aktivní tarif Standard nebo Pro. Limit faktur zůstává dle vašeho tarifu.
        </p>
        <MultiClientAddonCard
          hasMultiClient={hasMultiClient}
          hasPaidAccess={hasPaidAccess(profile)}
          stripeConfigured={stripeConfigured}
        />
      </div>
    </div>
  )
}

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Portál se nepodařilo otevřít')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Chyba při otevírání portálu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">Správa předplatného</p>
        <p className="text-xs text-gray-500 mt-0.5">Tarif i modul více klientů ve Stripe portálu</p>
      </div>
      <Button variant="outline" size="sm" onClick={openPortal} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
        Stripe portál
      </Button>
    </div>
  )
}

function PlanCard({
  tier,
  isCurrent,
  hasPro,
  stripeConfigured,
}: {
  tier: (typeof BILLING_TIERS)[number]
  isCurrent: boolean
  hasPro: boolean
  stripeConfigured: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    if (!tier.checkoutPlan || !stripeConfigured) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: tier.checkoutPlan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Platbu se nepodařilo spustit')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Chyba při spuštění platby')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white p-6',
        tier.highlighted && 'border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-50',
        isCurrent && !tier.highlighted && 'ring-2 ring-violet-500 border-violet-200'
      )}
    >
      {tier.highlighted && (
        <Badge className="absolute -top-2.5 left-4 bg-emerald-600 text-[10px] uppercase">Zdarma</Badge>
      )}
      {isCurrent && (
        <Badge className="absolute -top-2.5 right-4 bg-green-100 text-green-800 border-green-200 text-[10px]">
          Váš tarif
        </Badge>
      )}

      <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
      <p className="text-xs text-gray-500 mt-1 mb-4">{tier.tagline}</p>
      <div className="mb-4">
        <span className="text-3xl font-extrabold">{tier.price}</span>
        <span className="text-sm text-gray-500 ml-1">{tier.period}</span>
      </div>
      <ul className="space-y-2 flex-1 mb-6 text-sm text-gray-600">
        {tier.benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            {b}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <Button variant="secondary" disabled className="w-full">Aktuální tarif</Button>
      ) : tier.id === 'free' ? (
        <Button variant="outline" disabled className="w-full">Základní tarif</Button>
      ) : tier.id === 'starter' ? (
        !stripeConfigured ? (
          <Button variant="outline" disabled className="w-full">Vyžaduje Stripe</Button>
        ) : (
          <Button
            className="w-full bg-gray-900 hover:bg-gray-800"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dokoupit 100 faktur'}
          </Button>
        )
      ) : hasPro ? (
        <Button variant="secondary" disabled className="w-full">Změna v portálu</Button>
      ) : !stripeConfigured ? (
        <Button variant="outline" disabled className="w-full">Vyžaduje Stripe</Button>
      ) : (
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aktivovat Pro — 899 Kč/měsíc'}
        </Button>
      )}
    </div>
  )
}

function MultiClientAddonCard({
  hasMultiClient,
  hasPaidAccess,
  stripeConfigured,
}: {
  hasMultiClient: boolean
  hasPaidAccess: boolean
  stripeConfigured: boolean
}) {
  const [loading, setLoading] = useState(false)
  const addon = MULTI_CLIENT_ADDON

  async function handleCheckout() {
    if (!stripeConfigured) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'multi_client' }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Modul se nepodařilo aktivovat')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Chyba při spuštění platby')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white p-6 max-w-lg',
        hasMultiClient && 'ring-2 ring-violet-500 border-violet-200'
      )}
    >
      {hasMultiClient && (
        <Badge className="absolute -top-2.5 right-4 bg-violet-100 text-violet-800 text-[10px]">
          Aktivní
        </Badge>
      )}
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-5 w-5 text-violet-600" />
        <h3 className="text-lg font-bold text-gray-900">{addon.name}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{addon.tagline}</p>
      <div className="mb-4">
        <span className="text-3xl font-extrabold">+{addon.price}</span>
        <span className="text-sm text-gray-500 ml-1">{addon.period}</span>
      </div>
      <ul className="space-y-2 flex-1 mb-6 text-sm text-gray-600">
        {addon.benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
            {b}
          </li>
        ))}
      </ul>
      {hasMultiClient ? (
        <Button variant="secondary" disabled className="w-full">Modul aktivní</Button>
      ) : !hasPaidAccess ? (
        <Button variant="outline" disabled className="w-full">
          Nejdřív dokupte Standard (100 faktur) nebo Pro
        </Button>
      ) : !stripeConfigured ? (
        <Button variant="outline" disabled className="w-full">Vyžaduje Stripe</Button>
      ) : (
        <Button
          className="w-full bg-violet-600 hover:bg-violet-700"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Přidat modul za 299 Kč/měsíc'}
        </Button>
      )}
    </div>
  )
}
