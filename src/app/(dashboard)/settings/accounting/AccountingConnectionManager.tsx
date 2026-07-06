'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { AccountingConnection } from '@/types/invoices'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Provider = 'idoklad' | 'fakturoid' | 'superfaktura'
type IdokladMode = 'oauth2' | 'token'
type FakturoidMode = 'apikeys' | 'token'

interface Props {
  connections: AccountingConnection[]
  isAccountant: boolean
  workspaceName: string
}

const PROVIDERS: Provider[] = ['idoklad', 'fakturoid', 'superfaktura']

const PROVIDER_CONFIG = {
  idoklad: {
    label: 'iDoklad',
    emoji: '🧾',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-600',
    soft: 'bg-blue-50',
    desc: 'OAuth2 nebo Bearer token',
  },
  fakturoid: {
    label: 'Fakturoid',
    emoji: '📊',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-600',
    soft: 'bg-indigo-50',
    desc: 'Client ID + Secret nebo OAuth token',
  },
  superfaktura: {
    label: 'SuperFaktura',
    emoji: '📋',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-600',
    soft: 'bg-violet-50',
    desc: 'Email + API klíč',
  },
} as const

function ModeToggle({
  options,
  value,
  onChange,
  accent,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (v: string) => void
  accent: string
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'flex-1 text-xs font-medium py-2 px-3 rounded-lg border transition-colors',
            value === opt.id
              ? `${accent} border-current`
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function AccountingConnectionManager({
  connections,
  isAccountant,
  workspaceName,
}: Props) {
  const router = useRouter()
  const activeConnection = connections.find((c) => c.is_active !== false) ?? connections[0] ?? null

  const [picking, setPicking] = useState<Provider | null>(null)
  const [changing, setChanging] = useState(false)
  const [idokladMode, setIdokladMode] = useState<IdokladMode>('oauth2')
  const [fakturoidMode, setFakturoidMode] = useState<FakturoidMode>('apikeys')

  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [accountSlug, setAccountSlug] = useState('')
  const [apiEmail, setApiEmail] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [saving, setSaving] = useState(false)

  const showPicker = !activeConnection || changing
  const adding = picking

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Provider
    if (!hash || !PROVIDERS.includes(hash)) return

    if (activeConnection) {
      setChanging(true)
    }
    setPicking(hash)

    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deep link on mount only
  }, [])

  function resetForm() {
    setPicking(null)
    setChanging(false)
    setClientId('')
    setClientSecret('')
    setApiKey('')
    setAccountSlug('')
    setApiEmail('')
    setCompanyId('')
    setIdokladMode('oauth2')
    setFakturoidMode('apikeys')
  }

  function startChange() {
    setChanging(true)
    setPicking(null)
  }

  async function handleSave() {
    if (!adding) return

    if (adding === 'idoklad') {
      if (idokladMode === 'oauth2' && (!clientId || !clientSecret)) {
        toast.error('Vyplňte Client ID a Client Secret')
        return
      }
      if (idokladMode === 'token' && !apiKey) {
        toast.error('Vyplňte Bearer token')
        return
      }
    }
    if (adding === 'fakturoid') {
      if (fakturoidMode === 'apikeys' && (!clientId || !clientSecret)) {
        toast.error('Vyplňte Fakturoid Client ID a Client Secret')
        return
      }
      if (fakturoidMode === 'token' && (!accountSlug || !apiKey)) {
        toast.error('Vyplňte slug účtu a OAuth token')
        return
      }
    }
    if (adding === 'superfaktura' && (!apiEmail || !apiKey)) {
      toast.error('Vyplňte email a API klíč SuperFaktury')
      return
    }

    setSaving(true)
    let body: Record<string, unknown>
    if (adding === 'idoklad') {
      body =
        idokladMode === 'oauth2'
          ? { provider: 'idoklad', clientId, clientSecret, country: 'cz' }
          : { provider: 'idoklad', apiKey, country: 'cz' }
    } else if (adding === 'fakturoid') {
      body =
        fakturoidMode === 'apikeys'
          ? { provider: 'fakturoid', clientId, clientSecret, country: 'cz' }
          : { provider: 'fakturoid', apiKey, accountSlug, country: 'cz' }
    } else {
      body = {
        provider: 'superfaktura',
        apiEmail,
        apiKey,
        companyId,
      }
    }

    const res = await fetch('/api/accounting/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Nepodařilo se ověřit přihlašovací údaje')
      return
    }

    toast.success(
      changing ? 'Fakturační systém změněn' : 'Fakturační systém připojen'
    )
    resetForm()
    router.refresh()
  }

  const activeCfg = adding ? PROVIDER_CONFIG[adding] : null

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        {isAccountant ? (
          <>
            Klient <span className="font-medium text-gray-900">{workspaceName}</span> má
            právě <span className="font-medium text-gray-900">jeden</span> fakturační systém.
            Pro jiného klienta přepněte klienta v menu.
          </>
        ) : (
          <>
            V režimu Solo lze mít pouze{' '}
            <span className="font-medium text-gray-900">jeden</span> fakturační systém — vyberte
            iDoklad, Fakturoid nebo SuperFakturu.
          </>
        )}
      </div>

      {activeConnection && !changing && (
        <div className="bg-white rounded-xl border-2 border-green-200 p-5">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center text-2xl',
                PROVIDER_CONFIG[activeConnection.provider].bg
              )}
            >
              {PROVIDER_CONFIG[activeConnection.provider].emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-semibold text-gray-900">
                  {PROVIDER_CONFIG[activeConnection.provider].label}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Připojeno
                </span>
              </div>
              {activeConnection.account_slug && (
                <p className="text-xs text-gray-500 mt-1">
                  {activeConnection.provider === 'superfaktura'
                    ? `Company ID: ${activeConnection.account_slug}`
                    : activeConnection.provider === 'fakturoid'
                      ? `Slug: ${activeConnection.account_slug}`
                      : 'Aktivní připojení'}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={startChange}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Změnit systém
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPicker && !adding && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">
            {changing ? 'Vyberte nový fakturační systém' : 'Vyberte fakturační systém'}
          </p>
          {changing && activeConnection && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Stávající připojení ({PROVIDER_CONFIG[activeConnection.provider].label}) bude
              nahrazeno.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {PROVIDERS.map((provider) => {
              const cfg = PROVIDER_CONFIG[provider]
              return (
                <button
                  key={provider}
                  id={provider}
                  type="button"
                  onClick={() => setPicking(provider)}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition-all hover:border-blue-300 scroll-mt-24',
                    'border-gray-200 bg-white hover:bg-gray-50'
                  )}
                >
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-xl mb-3', cfg.bg)}>
                    {cfg.emoji}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{cfg.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{cfg.desc}</p>
                </button>
              )
            })}
          </div>
          {changing && (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Zrušit změnu
            </Button>
          )}
        </div>
      )}

      {adding && activeCfg && (
        <div id={adding} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 scroll-mt-24">
          <div className="flex items-center gap-3">
            <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-lg', activeCfg.bg)}>
              {activeCfg.emoji}
            </div>
            <p className="text-sm font-semibold text-gray-900">Připojit {activeCfg.label}</p>
          </div>

          {adding === 'idoklad' && (
            <>
              <p className="text-xs text-gray-500">
                iDoklad → Nastavení → Aplikace a služby → Moje aplikace → vytvořte OAuth2 aplikaci
                a zkopírujte Client ID + Client Secret. Nebo použijte Bearer token z iDoklad → API.
              </p>
              <ModeToggle
                options={[
                  { id: 'oauth2', label: 'OAuth2' },
                  { id: 'token', label: 'Bearer token' },
                ]}
                value={idokladMode}
                onChange={(v) => setIdokladMode(v as IdokladMode)}
                accent={`${activeCfg.text} ${activeCfg.soft} ${activeCfg.border}`}
              />
              {idokladMode === 'oauth2' ? (
                <>
                  <div>
                    <Label htmlFor="client-id">Client ID</Label>
                    <Input id="client-id" value={clientId} onChange={(e) => setClientId(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="client-secret">Client Secret</Label>
                    <Input
                      id="client-secret"
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="api-key-idoklad">Bearer token</Label>
                  <Input
                    id="api-key-idoklad"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}

          {adding === 'fakturoid' && (
            <>
              <ModeToggle
                options={[
                  { id: 'apikeys', label: 'Client ID + Secret' },
                  { id: 'token', label: 'OAuth token' },
                ]}
                value={fakturoidMode}
                onChange={(v) => setFakturoidMode(v as FakturoidMode)}
                accent={`${activeCfg.text} ${activeCfg.soft} ${activeCfg.border}`}
              />
              {fakturoidMode === 'apikeys' ? (
                <>
                  <p className="text-xs text-gray-500">
                    Fakturoid → Nastavení → Uživatelský účet → API → vytvořte integraci.
                    Vyžaduje placený tarif Fakturoid — zdarma tarif neumožňuje vytváření nákladů přes API.
                  </p>
                  <div>
                    <Label htmlFor="fakturoid-client-id">Client ID</Label>
                    <Input
                      id="fakturoid-client-id"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fakturoid-client-secret">Client Secret</Label>
                    <Input
                      id="fakturoid-client-secret"
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="slug">Slug účtu</Label>
                    <Input id="slug" value={accountSlug} onChange={(e) => setAccountSlug(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="api-key-fakturoid">OAuth token</Label>
                    <Input
                      id="api-key-fakturoid"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {adding === 'superfaktura' && (
            <>
              <p className="text-xs text-gray-500">
                SuperFaktura → Nástroje → API přístup. Doporučujeme API uživatele s rolí Administrátor.
                Ve SuperFaktuře musí být kompletně vyplněný firemní profil (IČO, adresa, DIČ) — jinak
                odeslání faktury selže.
              </p>
              <div>
                <Label htmlFor="sf-email">Email (API účet)</Label>
                <Input
                  id="sf-email"
                  type="email"
                  placeholder="email@firma.cz"
                  value={apiEmail}
                  onChange={(e) => setApiEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sf-key">API klíč</Label>
                <Input
                  id="sf-key"
                  type="password"
                  placeholder="z SuperFaktura → Nastavení → API"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sf-company">Company ID (volitelné)</Label>
                <Input
                  id="sf-company"
                  placeholder="ID firmy z API nastavení"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={resetForm}>
              Zrušit
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Ověřuji…' : changing ? 'Změnit připojení' : 'Připojit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
