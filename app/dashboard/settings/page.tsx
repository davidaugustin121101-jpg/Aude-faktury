'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase-client'
import { PLANS, PlanKey } from '@/lib/stripe'

export default function SettingsPage() {
  const [plan, setPlan] = useState<PlanKey>('free')
  const [used, setUsed] = useState(0)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_profiles')
        .select('plan, invoices_this_month')
        .eq('id', user.id)
        .single()

      if (data) {
        setPlan((data.plan as PlanKey) ?? 'free')
        setUsed(data.invoices_this_month ?? 0)
      }
    }
    load()
  }, [])

  const handleUpgrade = async (targetPlan: 'starter' | 'pro') => {
    setLoading(targetPlan)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: targetPlan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(null)
  }

  const current = PLANS[plan]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Nastavení</h1>
      <p className="text-gray-500 text-sm mb-8">Plán a fakturace</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <p className="text-sm text-gray-500">Aktuální plán</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{current.name}</p>
        <p className="text-sm text-gray-600 mt-2">
          {used} / {current.limit === 999999 ? 'neomezeno' : current.limit} faktur tento měsíc
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {(['free', 'starter', 'pro'] as PlanKey[]).map((key) => {
          const p = PLANS[key]
          const isCurrent = key === plan
          return (
            <div
              key={key}
              className={`rounded-2xl border p-6 ${
                isCurrent ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
              }`}
            >
              <h3 className="font-bold text-gray-900">{p.name}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {p.price === 0 ? '0 Kč' : `${p.price} Kč`}
                {p.price > 0 && <span className="text-sm font-normal text-gray-500">/měsíc</span>}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {p.limit === 999999 ? 'Neomezeno faktur' : `${p.limit} faktur/měsíc`}
              </p>
              {isCurrent ? (
                <p className="mt-4 text-xs text-blue-600 font-medium">Aktuální plán</p>
              ) : key !== 'free' ? (
                <button
                  onClick={() => handleUpgrade(key as 'starter' | 'pro')}
                  disabled={loading !== null}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl"
                >
                  {loading === key ? 'Přesměrovávám…' : `Přejít na ${p.name}`}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
