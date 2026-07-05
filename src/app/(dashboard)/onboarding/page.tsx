'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Settings2, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { CountryCode } from '@/lib/accounting-codes'

type AccountingProvider = 'idoklad' | 'fakturoid' | 'superfaktura' | null

const STEPS = [
  { id: 1, label: 'Fakturace', icon: Building2 },
  { id: 2, label: 'Pravidla', icon: Settings2 },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [accountingProvider, setAccountingProvider] = useState<AccountingProvider>(null)
  const [userCountry, setUserCountry] = useState<CountryCode>('cz')
  const [apiKey, setApiKey] = useState('')
  const [accountSlug, setAccountSlug] = useState('')
  const [apiEmail, setApiEmail] = useState('')
  const [companyId, setCompanyId] = useState('')

  const [autoApproveBelow, setAutoApproveBelow] = useState('')
  const [notifyOnNew, setNotifyOnNew] = useState(true)

  useEffect(() => {
    fetch('/api/user/country')
      .then((r) => r.json())
      .then((d) => {
        if (d.country === 'sk' || d.country === 'cz') setUserCountry(d.country)
      })
      .catch(() => {})
  }, [])

  async function handleStep1() {
    if (!accountingProvider) {
      toast.error('Vyberte fakturační systém')
      return
    }
    if (accountingProvider !== 'superfaktura' && !apiKey) {
      toast.error('Zadejte API klíč / token')
      return
    }
    if (accountingProvider === 'superfaktura' && (!apiEmail || !apiKey)) {
      toast.error('Vyplňte email a API klíč SuperFaktury')
      return
    }
    if (accountingProvider === 'fakturoid' && !accountSlug) {
      toast.error('Zadejte slug účtu Fakturoid')
      return
    }
    if (accountingProvider === 'superfaktura' && !apiEmail) {
      toast.error('Zadejte email SuperFaktury')
      return
    }
    setLoading(true)
    const body =
      accountingProvider === 'superfaktura'
        ? { provider: 'superfaktura', apiEmail, apiKey, companyId, country: userCountry }
        : { provider: accountingProvider, apiKey, accountSlug, country: userCountry }

    const res = await fetch('/api/accounting/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error('Nepodařilo se ověřit API klíč')
      return
    }
    setStep(2)
  }

  async function handleStep2() {
    setLoading(true)
    await fetch('/api/invoices/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autoApproveBelow: autoApproveBelow ? Number(autoApproveBelow) : null,
        notifyOnNew,
      }),
    })
    setLoading(false)
    router.push('/faktury/upload')
  }

  function skipToUpload() {
    router.push('/faktury/upload')
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-gray-900">Nastavení zpracování faktur</h1>
        <p className="text-gray-500 mt-2">
          Připoj fakturační systém nebo rovnou nahraj první PDF fakturu.
        </p>
      </div>

      <div className="flex items-center justify-center gap-0 mb-10">
        {STEPS.map((s, idx) => {
          const done = s.id < step
          const active = s.id === step
          const Icon = s.icon
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    done
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : active
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-gray-200 text-gray-400 bg-white'
                  )}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn('w-20 h-0.5 mx-2 mb-5', s.id < step ? 'bg-blue-600' : 'bg-gray-200')}
                />
              )}
            </div>
          )
        })}
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Vyberte fakturační systém</h2>
              <p className="text-sm text-gray-500">
                Jeden účet = jeden systém. Vyberte iDoklad, Fakturoid nebo SuperFakturu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userCountry === 'cz' && (
                <>
                  <ProviderButton
                    active={accountingProvider === 'idoklad'}
                    onClick={() => setAccountingProvider('idoklad')}
                    emoji="🧾"
                    label="iDoklad"
                    description="REST API v3"
                  />
                  <ProviderButton
                    active={accountingProvider === 'fakturoid'}
                    onClick={() => setAccountingProvider('fakturoid')}
                    emoji="📊"
                    label="Fakturoid"
                    description="API v3"
                  />
                </>
              )}
              <ProviderButton
                active={accountingProvider === 'superfaktura'}
                onClick={() => setAccountingProvider('superfaktura')}
                emoji="🇸🇰"
                label="SuperFaktura"
                description={userCountry === 'sk' ? 'moja.superfaktura.sk' : 'moje.superfaktura.cz'}
              />
            </div>

            {accountingProvider === 'superfaktura' && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <Label htmlFor="sf-email">Email (API)</Label>
                  <Input id="sf-email" type="email" value={apiEmail} onChange={(e) => setApiEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="sf-key">API klíč</Label>
                  <Input id="sf-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="sf-co">Company ID (volitelné)</Label>
                  <Input id="sf-co" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="mt-1" />
                </div>
              </div>
            )}

            {accountingProvider && accountingProvider !== 'superfaktura' && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                {accountingProvider === 'fakturoid' && (
                  <div>
                    <Label htmlFor="acc-slug">Slug účtu (z URL Fakturoid)</Label>
                    <Input
                      id="acc-slug"
                      placeholder="nazev-firmy"
                      value={accountSlug}
                      onChange={(e) => setAccountSlug(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="api-key">
                    {accountingProvider === 'idoklad' ? 'API klíč (Bearer token)' : 'OAuth token'}
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={handleStep1} disabled={!accountingProvider || !apiKey || loading} className="w-full">
                {loading ? 'Ověřuji...' : 'Pokračovat'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="ghost" onClick={skipToUpload} className="w-full text-gray-500">
                Přeskočit a nahrát fakturu →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Pravidla zpracování</h2>
              <p className="text-sm text-gray-500">Toto můžete kdykoli změnit v nastavení.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Emailové notifikace</p>
                  <p className="text-xs text-gray-500 mt-0.5">Upozornit při každé nové faktuře</p>
                </div>
                <button
                  onClick={() => setNotifyOnNew(!notifyOnNew)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    notifyOnNew ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                      notifyOnNew ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-3">Automatické schválení (volitelné)</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Např. 5000"
                    value={autoApproveBelow}
                    onChange={(e) => setAutoApproveBelow(e.target.value)}
                    className="w-40"
                  />
                  <span className="text-sm text-gray-500">Kč</span>
                </div>
              </div>
            </div>

            <Button onClick={handleStep2} disabled={loading} className="w-full">
              {loading ? 'Ukládám...' : 'Dokončit a nahrát první fakturu'}
              <CheckCircle2 className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

interface ProviderButtonProps {
  active: boolean
  onClick: () => void
  emoji: string
  label: string
  description: string
}

function ProviderButton({ active, onClick, emoji, label, description }: ProviderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:border-blue-300',
        active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
      )}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className={cn('text-sm font-semibold', active ? 'text-blue-700' : 'text-gray-900')}>{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      {active && <CheckCircle2 className="h-5 w-5 text-blue-600 ml-auto shrink-0" />}
    </button>
  )
}
