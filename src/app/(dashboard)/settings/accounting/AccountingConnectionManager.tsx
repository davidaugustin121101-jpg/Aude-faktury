'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { AccountingConnection } from '@/types/invoices'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Provider = 'idoklad' | 'fakturoid' | 'superfaktura' | 'bitfaktura' | 'sucto'
type IdokladMode = 'oauth2' | 'token'
type FakturoidMode = 'apikeys' | 'token'

interface Props {
  connections: AccountingConnection[]
  isAccountant: boolean
  workspaceName: string
}

const PROVIDERS: Provider[] = [
  'idoklad',
  'fakturoid',
  'superfaktura',
  'bitfaktura',
  'sucto',
]

const PROVIDER_CONFIG = {
  idoklad: {
    label: 'iDoklad',
    logo: '/logos/systems/idoklad.png',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-600',
    soft: 'bg-blue-50',
    desc: 'OAuth2 nebo Bearer token',
  },
  fakturoid: {
    label: 'Fakturoid',
    logo: '/logos/systems/fakturoid.png',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-600',
    soft: 'bg-indigo-50',
    desc: 'Client ID + Secret nebo OAuth token',
  },
  superfaktura: {
    label: 'SuperFaktura',
    logo: '/logos/systems/superfaktura.png',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-600',
    soft: 'bg-violet-50',
    desc: 'Email + API klíč',
  },
  bitfaktura: {
    label: 'BitFaktura',
    logo: '/logos/systems/bitfaktura.png',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-600',
    soft: 'bg-amber-50',
    desc: 'Subdoména + API token',
  },
  sucto: {
    label: 'Súčto',
    logo: '/logos/systems/sucto.png',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-600',
    soft: 'bg-teal-50',
    desc: 'Přihlášení www.sucto.cz + firma',
  },
} as const

function ProviderLogo({
  logo,
  label,
  className,
  imageClassName,
}: {
  logo: string
  label: string
  className?: string
  imageClassName?: string
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white',
        className
      )}
    >
      <Image
        src={logo}
        alt={`Logo ${label}`}
        fill
        className={cn('object-contain object-center p-1.5', imageClassName)}
        sizes="120px"
      />
    </div>
  )
}

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
  const [suctoPassword, setSuctoPassword] = useState('')
  const [suctoCompanies, setSuctoCompanies] = useState<
    Array<{ id: number; name: string; ic?: string | null }>
  >([])
  const [loadingSuctoCompanies, setLoadingSuctoCompanies] = useState(false)
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
    setSuctoPassword('')
    setSuctoCompanies([])
    setLoadingSuctoCompanies(false)
    setIdokladMode('oauth2')
    setFakturoidMode('apikeys')
  }

  function startChange() {
    setChanging(true)
    setPicking(null)
  }

  async function loadSuctoCompanies() {
    if (!apiEmail || !suctoPassword) {
      toast.error('Nejdřív vyplňte e-mail a heslo ze Súčta')
      return
    }

    setLoadingSuctoCompanies(true)
    try {
      const res = await fetch('/api/accounting/sucto/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: apiEmail, password: suctoPassword }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        companies?: Array<{ id: number; name: string; ic?: string | null }>
      }
      if (!res.ok) {
        toast.error(data.error ?? 'Nepodařilo se načíst firmy ze Súčta')
        return
      }

      const companies = data.companies ?? []
      setSuctoCompanies(companies)
      if (companies.length === 1) {
        setCompanyId(String(companies[0].id))
      }
      toast.success(
        companies.length === 1
          ? `Načtena firma ${companies[0].name}`
          : `Načteno ${companies.length} firem — vyberte správnou`
      )
    } catch {
      toast.error('Nepodařilo se načíst firmy ze Súčta')
    } finally {
      setLoadingSuctoCompanies(false)
    }
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
    if (adding === 'bitfaktura' && (!accountSlug || !apiKey)) {
      toast.error('Vyplňte subdoménu a API token BitFaktury')
      return
    }
    if (adding === 'sucto' && (!apiEmail || !suctoPassword || !companyId)) {
      toast.error('Vyplňte e-mail, heslo a ID firmy Súčto')
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
    } else if (adding === 'superfaktura') {
      body = {
        provider: 'superfaktura',
        apiEmail,
        apiKey,
        companyId,
      }
    } else if (adding === 'bitfaktura') {
      body = {
        provider: 'bitfaktura',
        accountSlug,
        apiKey,
      }
    } else if (adding === 'sucto') {
      body = {
        provider: 'sucto',
        apiEmail,
        suctoPassword,
        companyId,
      }
    } else {
      toast.error('Neznámý fakturační systém')
      return
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
            iDoklad, Fakturoid, SuperFakturu, BitFakturu nebo Súčto.
          </>
        )}
      </div>

      {activeConnection && !changing && (
        <div className="bg-white rounded-xl border-2 border-green-200 p-5">
          <div className="flex items-start gap-4">
            <ProviderLogo
              logo={PROVIDER_CONFIG[activeConnection.provider].logo}
              label={PROVIDER_CONFIG[activeConnection.provider].label}
              className="h-12 w-28"
            />
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
                      : activeConnection.provider === 'bitfaktura'
                        ? `${activeConnection.account_slug}.bitfaktura.cz`
                        : activeConnection.provider === 'sucto'
                          ? `Firma #${activeConnection.account_slug}`
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  <ProviderLogo logo={cfg.logo} label={cfg.label} className="h-11 w-full max-w-[140px] mb-3" />
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
            <ProviderLogo logo={activeCfg.logo} label={activeCfg.label} className="h-9 w-24" />
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

          {adding === 'bitfaktura' && (
            <>
              <p className="text-xs text-gray-500">
                BitFaktura → Nastavení → Nastavení účtu → Integrace → Autorizační kód API.
                Subdoména je část URL před .bitfaktura.cz (např.{' '}
                <span className="font-mono">mojefirma</span>).
              </p>
              <div>
                <Label htmlFor="bf-domain">Subdoména účtu</Label>
                <Input
                  id="bf-domain"
                  placeholder="mojefirma"
                  value={accountSlug}
                  onChange={(e) => setAccountSlug(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bf-token">API token</Label>
                <Input
                  id="bf-token"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {adding === 'sucto' && (
            <>
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-xs text-gray-700 space-y-3">
                <p className="font-semibold text-teal-900">Jak připojit Súčto — krok za krokem</p>
                <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                  <li>
                    Otevřete{' '}
                    <a
                      href="https://www.sucto.cz/users/sign_in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-teal-800 underline"
                    >
                      www.sucto.cz
                    </a>{' '}
                    a přihlaste se <strong>e-mailem a heslem</strong> (stejné jako níže). Účet přes
                    Google do API nefunguje — pokud nemáte heslo, nastavte si ho ve Súčtu.
                  </li>
                  <li>Po přihlášení klikněte na firmu klienta v přehledu.</li>
                  <li>
                    Otevřete <strong>Nastavení firmy</strong> a na konci stránky zaškrtněte{' '}
                    <strong>Aktivní API</strong>. Uložte změny.
                  </li>
                  <li>
                    Vyplňte e-mail a heslo níže a klikněte <strong>Načíst firmy</strong> — ID
                    doplníme automaticky.
                  </li>
                </ol>
                <div className="rounded-lg border border-teal-200 bg-white px-3 py-2.5 font-mono text-[11px] leading-relaxed text-gray-700">
                  <p className="font-sans font-semibold text-teal-900 mb-1">
                    Kde najdu ID firmy ručně?
                  </p>
                  <p>Po výběru firmy se podívejte do adresního řádku prohlížeče:</p>
                  <p className="mt-1 break-all">
                    www.sucto.cz/companies/<span className="font-bold text-teal-800">42</span>
                    /dashboard
                  </p>
                  <p className="mt-1 font-sans text-gray-600">
                    Číslo <strong>42</strong> (mezi <code>/companies/</code> a dalším lomítkem) je
                    ID firmy.
                  </p>
                </div>
                <p className="text-gray-500">
                  Účetní kancelář: použijte svůj Súčto účet s přístupem k firmě klienta. Pro každého
                  klienta (workspace) připojte jeho firmu zvlášť.
                </p>
              </div>
              <div>
                <Label htmlFor="sucto-email">E-mail ze Súčta</Label>
                <Input
                  id="sucto-email"
                  type="email"
                  placeholder="stejný e-mail jako na www.sucto.cz"
                  value={apiEmail}
                  onChange={(e) => {
                    setApiEmail(e.target.value)
                    setSuctoCompanies([])
                    setCompanyId('')
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sucto-password">Heslo ze Súčta</Label>
                <Input
                  id="sucto-password"
                  type="password"
                  placeholder="heslo k účtu (ne Google přihlášení)"
                  value={suctoPassword}
                  onChange={(e) => {
                    setSuctoPassword(e.target.value)
                    setSuctoCompanies([])
                    setCompanyId('')
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="sucto-company">Firma ve Súčtu</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadSuctoCompanies}
                    disabled={loadingSuctoCompanies}
                  >
                    {loadingSuctoCompanies ? 'Načítám…' : 'Načíst firmy'}
                  </Button>
                </div>
                {suctoCompanies.length > 0 ? (
                  <select
                    id="sucto-company"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Vyberte firmu</option>
                    {suctoCompanies.map((company) => (
                      <option key={company.id} value={String(company.id)}>
                        {company.id} — {company.name}
                        {company.ic ? ` (IČO ${company.ic})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="sucto-company"
                    placeholder="např. 42 — nebo klikněte Načíst firmy"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="mt-1"
                  />
                )}
                <p className="mt-1.5 text-[11px] text-gray-500">
                  ID firmy je číslo v adrese po výběru firmy ve Súčtu. Tlačítko „Načíst firmy“ ho
                  doplní automaticky.
                </p>
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
