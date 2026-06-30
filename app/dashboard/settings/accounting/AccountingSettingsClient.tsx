'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { WORKSPACE_CHANGED_EVENT } from '@/components/WorkspaceSwitcher'

type Provider = 'idoklad' | 'fakturoid'

interface ConnectionStatus {
  connected: boolean
  workspaceId?: string
  workspaceName?: string
  provider?: Provider
  label?: string
  fakturoidSlug?: string
  connectionMode?: 'oauth' | 'api_keys'
  fakturoidClientId?: string
  hasFakturoidSecret?: boolean
  idokladClientId?: string
  hasIdokladSecret?: boolean
  lastTestedAt?: string
}

interface FakturoidConfig {
  oauthConfigured: boolean
  oauthReady: boolean
  redirectUri: string
  redirectError: string | null
  appUrl: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  fakturoid_denied: 'Připojení k Fakturoidu bylo zrušeno.',
  fakturoid_state: 'Neplatný OAuth stav. Zkus připojit znovu.',
  fakturoid_not_configured:
    'Fakturoid OAuth není nastaven na serveru (chybí FAKTUROID_CLIENT_ID).',
  fakturoid_failed: 'Připojení k Fakturoidu selhalo. Zkus to znovu.',
}

export default function AccountingSettingsClient() {
  const searchParams = useSearchParams()
  const [provider, setProvider] = useState<Provider>('fakturoid')
  const [connection, setConnection] = useState<ConnectionStatus>({ connected: false })
  const [fakturoidConfig, setFakturoidConfig] = useState<FakturoidConfig | null>(null)
  const [fakturoidClientId, setFakturoidClientId] = useState('')
  const [fakturoidClientSecret, setFakturoidClientSecret] = useState('')
  const [idokladClientId, setIdokladClientId] = useState('')
  const [idokladClientSecret, setIdokladClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'ok' | 'error'>('ok')

  const loadStatus = useCallback(async () => {
    const [statusRes, configRes] = await Promise.all([
      fetch('/api/accounting'),
      fetch('/api/accounting/fakturoid/config'),
    ])
    if (statusRes.ok) {
      const data = await statusRes.json()
      setConnection(data)
      setProvider(data.connected && data.provider ? data.provider : 'idoklad')
      setIdokladClientId(data.idokladClientId ?? '')
      setFakturoidClientId(data.fakturoidClientId ?? '')
      setIdokladClientSecret('')
      setFakturoidClientSecret('')
    }
    if (configRes.ok) {
      setFakturoidConfig(await configRes.json())
    }
  }, [])

  useEffect(() => {
    loadStatus()
    const onWorkspaceChange = () => loadStatus()
    window.addEventListener(WORKSPACE_CHANGED_EVENT, onWorkspaceChange)
    return () => window.removeEventListener(WORKSPACE_CHANGED_EVENT, onWorkspaceChange)
  }, [loadStatus])

  useEffect(() => {
    if (searchParams.get('connected') === 'fakturoid') {
      setMessage('Fakturoid úspěšně připojen ✓')
      setMessageType('ok')
      loadStatus()
      window.history.replaceState({}, '', '/dashboard/settings/accounting')
    }
    const err = searchParams.get('error')
    if (err) {
      const decoded = ERROR_MESSAGES[err] ?? decodeURIComponent(err)
      setMessage(decoded)
      setMessageType('error')
      window.history.replaceState({}, '', '/dashboard/settings/accounting')
    }
  }, [searchParams, loadStatus])

  const handleTestIdoklad = async () => {
    setLoading(true)
    setMessage(null)
    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test-idoklad',
        idoklad_client_id: idokladClientId,
        idoklad_client_secret: idokladClientSecret || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setMessage(data.error ?? 'Test selhal')
      setMessageType('error')
      return
    }
    setMessage(`Připojení funguje ✓ (${data.label})`)
    setMessageType('ok')
  }

  const handleSaveIdoklad = async () => {
    setLoading(true)
    setMessage(null)
    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save-idoklad',
        idoklad_client_id: idokladClientId,
        idoklad_client_secret: idokladClientSecret || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setMessage(data.error ?? 'Uložení selhalo')
      setMessageType('error')
      return
    }
    setIdokladClientSecret('')
    setMessage(`iDoklad připojen ✓ (${data.label})`)
    setMessageType('ok')
    loadStatus()
  }

  const handleSaveFakturoidApi = async () => {
    setLoading(true)
    setMessage(null)
    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save-fakturoid-api',
        fakturoid_client_id: fakturoidClientId,
        fakturoid_client_secret: fakturoidClientSecret || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setMessage(data.error ?? 'Uložení selhalo')
      setMessageType('error')
      return
    }
    setFakturoidClientSecret('')
    setMessage(`Fakturoid připojen ✓ (${data.label})`)
    setMessageType('ok')
    loadStatus()
  }

  const handleTestFakturoid = async () => {
    setLoading(true)
    setMessage(null)
    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test-fakturoid' }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setMessage(data.error ?? 'Test selhal')
      setMessageType('error')
      return
    }
    setMessage(
      data.warning
        ? `${data.warning} Připojení funguje ✓ (${data.label})`
        : `Fakturoid funguje ✓ (${data.label}${data.plan ? `, tarif ${data.plan}` : ''})`
    )
    setMessageType('ok')
    loadStatus()
  }

  const handleDisconnect = async () => {
    setLoading(true)
    await fetch('/api/accounting', { method: 'DELETE' })
    setLoading(false)
    setConnection({
      connected: false,
      workspaceId: connection.workspaceId,
      workspaceName: connection.workspaceName,
    })
    setIdokladClientId('')
    setIdokladClientSecret('')
    setFakturoidClientId('')
    setFakturoidClientSecret('')
    setMessage(
      connection.workspaceName
        ? `Připojení odpojeno pro klienta „${connection.workspaceName}".`
        : 'Připojení odpojeno.'
    )
    setMessageType('ok')
  }

  const fakturoidConnected =
    connection.connected && connection.provider === 'fakturoid'
  const idokladConnected = connection.connected && connection.provider === 'idoklad'
  const oauthReady = fakturoidConfig?.oauthReady ?? false

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Fakturační systém</h1>

      {connection.workspaceName && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-900">
            Nastavení pro klienta:{' '}
            <strong>{connection.workspaceName}</strong>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Přepni klienta v sidebaru — každý má vlastní iDoklad nebo Fakturoid.
          </p>
          <Link
            href="/dashboard/clients"
            className="text-xs text-blue-600 underline mt-1 inline-block"
          >
            Spravovat klienty →
          </Link>
        </div>
      )}

      <p className="text-gray-500 text-sm mb-6">
        Připoj iDoklad nebo Fakturoid pro aktivního klienta. Faktury se po schválení odešlou
        automaticky.
      </p>

      {connection.connected ? (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          <p className="font-medium">
            ✓ Připojeno pro klienta {connection.workspaceName}:{' '}
            {connection.provider === 'idoklad' ? 'iDoklad' : 'Fakturoid'}
            {connection.label ? ` — ${connection.label}` : ''}
          </p>
          {connection.fakturoidSlug && (
            <p className="text-xs text-green-600 mt-1">Účet: {connection.fakturoidSlug}</p>
          )}
          {connection.connectionMode && (
            <p className="text-xs text-green-600 mt-1">
              Režim: {connection.connectionMode === 'oauth' ? 'OAuth' : 'API klíče'}
            </p>
          )}
          {connection.lastTestedAt && (
            <p className="text-xs text-green-600 mt-1">
              Naposledy ověřeno:{' '}
              {new Date(connection.lastTestedAt).toLocaleString('cs-CZ')}
            </p>
          )}
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="mt-3 text-xs text-red-600 underline hover:text-red-800"
          >
            Odpojit pro tohoto klienta
          </button>
        </div>
      ) : connection.workspaceName ? (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <p className="font-medium">
            Klient {connection.workspaceName} nemá připojený fakturační systém.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Vyber iDoklad nebo Fakturoid níže a ulož API klíče pro tohoto klienta.
          </p>
        </div>
      ) : null}

      <div className="flex gap-2 mb-6">
        {(['fakturoid', 'idoklad'] as Provider[]).map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              provider === p
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            {p === 'idoklad' ? 'iDoklad' : 'Fakturoid'}
          </button>
        ))}
      </div>

      {provider === 'fakturoid' ? (
        <div className="space-y-6">
          {/* API klíče – doporučeno pro lokální vývoj */}
          <div className="space-y-4 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Fakturoid — API klíče</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Rychlé připojení vlastního účtu. Klíče najdeš ve Fakturoidu:{' '}
              <strong>Nastavení → Uživatelský účet</strong> (ne OAuth integrace).
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 mt-2 leading-relaxed">
              Tarif <strong>Zdarma</strong> neumí vytvářet výdaje přes API. Faktury se nahrají
              do Krabice na náklady. Pro plnou automatizaci přejdi na tarif Na lehko+ nebo použij
              iDoklad.
            </p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                Doporučeno lokálně
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Client ID</label>
              <input
                value={fakturoidClientId}
                onChange={(e) => setFakturoidClientId(e.target.value)}
                placeholder="Client ID z Uživatelského účtu"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                value={fakturoidClientSecret}
                onChange={(e) => setFakturoidClientSecret(e.target.value)}
                placeholder={
                  fakturoidConnected && connection.hasFakturoidSecret
                    ? '••••••••  (nech prázdné pro zachování)'
                    : 'Client Secret z Uživatelského účtu'
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 pt-1">
              {fakturoidConnected && (
                <button
                  onClick={handleTestFakturoid}
                  disabled={loading}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Otestovat
                </button>
              )}
              <button
                onClick={handleSaveFakturoidApi}
                disabled={loading || !fakturoidClientId.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {fakturoidConnected ? 'Uložit znovu' : 'Uložit a připojit'}
              </button>
            </div>
          </div>

          {/* OAuth – pro produkci / multi-tenant */}
          <div className="space-y-4 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900">Fakturoid — OAuth (pro zákazníky)</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pro SaaS: zákazník klikne a povolí přístup ve Fakturoidu. Vyžaduje registrovanou
              OAuth integraci a veřejnou doménu (localhost nefunguje).
            </p>

            {fakturoidConfig?.redirectError && (
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 leading-relaxed">
                {fakturoidConfig.redirectError}
              </div>
            )}

            {fakturoidConfig && (
              <p className="text-xs text-gray-400 break-all">
                Redirect URL pro Fakturoid integraci:{' '}
                <code className="bg-gray-100 px-1 rounded">{fakturoidConfig.redirectUri}</code>
              </p>
            )}

            {oauthReady ? (
              <a
                href="/api/accounting/fakturoid/connect"
                className="block text-center px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800"
              >
                {fakturoidConnected && connection.connectionMode === 'oauth'
                  ? 'Připojit jiný Fakturoid účet (OAuth)'
                  : 'Připojit přes OAuth'}
              </a>
            ) : (
              <button
                disabled
                className="w-full px-5 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-semibold cursor-not-allowed"
                title={fakturoidConfig?.redirectError ?? 'OAuth není připraveno'}
              >
                OAuth není dostupné (viz návod výše)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900">iDoklad — API klíče</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            V iDokladu: <strong>Nastavení → Aplikace → API</strong> → Vygenerovat. Zadej Client ID
            a Client Secret své aplikace (UUID formát, ne Fakturoid klíče).
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 leading-relaxed">
            API vyžaduje placený tarif iDokladu (Standard+). Aplikace musí mít oprávnění pro{' '}
            <strong>Přijaté faktury</strong> a <strong>Kontakty</strong>.
          </p>
          <a
            href="https://app.idoklad.cz/Settings/Api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 underline"
          >
            Otevřít iDoklad API nastavení →
          </a>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Client ID</label>
            <input
              value={idokladClientId}
              onChange={(e) => setIdokladClientId(e.target.value)}
              placeholder="např. a1b2c3d4-..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Client Secret
            </label>
            <input
              type="password"
              value={idokladClientSecret}
              onChange={(e) => setIdokladClientSecret(e.target.value)}
              placeholder={
                idokladConnected && connection.hasIdokladSecret
                  ? '••••••••  (nech prázdné pro zachování)'
                  : 'Client Secret z iDokladu'
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTestIdoklad}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Otestovat
            </button>
            <button
              onClick={handleSaveIdoklad}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Uložit a připojit
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 text-sm ${messageType === 'error' ? 'text-red-600' : 'text-green-600'}`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
