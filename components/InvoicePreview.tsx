'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfidenceBadge from './ConfidenceBadge'

interface Invoice {
  id: string
  confidence?: number
  ucetni_kod_confidence?: number
  problemy?: string[]
  is_duplicate?: boolean
  duplicate_of?: string | null
  dodavatel_nazev?: string
  dodavatel_ico?: string
  dodavatel_dic?: string
  cislo_faktury?: string
  variabilni_symbol?: string
  datum_vystaveni?: string
  datum_splatnosti?: string
  castka_bez_dph?: number
  sazba_dph?: number
  castka_dph?: number
  castka_celkem?: number
  popis_plneni?: string
  ucetni_kod?: string
  ucetni_kod_nazev?: string
  ucetni_kod_duvod?: string
  [key: string]: unknown
}

export default function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const [data, setData] = useState(invoice)
  const [isSending, setIsSending] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)

  const fromMemory = (data.ucetni_kod_duvod ?? '').includes('Paměť dodavatele')

  const field = (key: string, label: string, type = 'text') => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={(data[key] as string | number) ?? ''}
        onChange={(e) => setData({ ...data, [key]: e.target.value })}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )

  const handleApprove = async (forceDuplicate = false) => {
    setIsSending(true)
    setError(null)
    try {
      const res = await fetch('/api/invoices/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          updatedData: data,
          forceDuplicate,
        }),
      })
      const result = await res.json()
      if (res.status === 409 && result.duplicate) {
        setError(result.error)
        return
      }
      if (!res.ok) {
        setError(result.error)
        return
      }
      if (result.fakturoidMode === 'inbox') {
        router.push('/dashboard?sent=inbox')
        return
      }
      const params = new URLSearchParams({ sent: '1' })
      if (result.documentUrl) params.set('url', result.documentUrl)
      if (result.documentId) params.set('docId', result.documentId)
      router.push(`/dashboard?${params.toString()}`)
    } catch {
      setError('Chyba při odesílání. Zkus to znovu.')
    } finally {
      setIsSending(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    await fetch('/api/invoices/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: invoice.id }),
    })
    router.push('/dashboard')
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Zkontroluj fakturu</h1>
        <ConfidenceBadge value={data.confidence ?? 0} />
      </div>

      {data.is_duplicate && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-900">
          <strong>Možná duplicita</strong> — stejná faktura od tohoto dodavatele už v systému je.
          {data.duplicate_of && (
            <p className="mt-1 text-xs text-orange-700">
              Původní záznam:{' '}
              <a
                href={`/dashboard/invoice/${data.duplicate_of}`}
                className="underline font-medium"
              >
                otevřít
              </a>
            </p>
          )}
        </div>
      )}

      {(data.confidence ?? 1) < 0.75 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <strong>Zkontroluj zvýrazněná pole</strong> – Claude si u nich není jistý.
          {data.problemy && data.problemy.length > 0 && (
            <ul className="mt-1 list-disc list-inside text-yellow-700 text-xs">
              {data.problemy.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        {field('dodavatel_nazev', 'Dodavatel')}
        <div className="grid grid-cols-2 gap-4">
          {field('dodavatel_ico', 'IČO')}
          {field('dodavatel_dic', 'DIČ')}
          {field('cislo_faktury', 'Číslo faktury')}
          {field('variabilni_symbol', 'Variabilní symbol')}
          {field('datum_vystaveni', 'Datum vystavení', 'date')}
          {field('datum_splatnosti', 'Datum splatnosti', 'date')}
          {field('castka_bez_dph', 'Základ DPH (Kč)', 'number')}
          {field('sazba_dph', 'Sazba DPH (%)', 'number')}
          {field('castka_dph', 'DPH (Kč)', 'number')}
          {field('castka_celkem', 'Celkem (Kč)', 'number')}
        </div>
        {field('popis_plneni', 'Popis plnění')}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Navržený účetní kód
          </p>
          <div className="flex items-center gap-2">
            {fromMemory && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                z paměti
              </span>
            )}
            <ConfidenceBadge value={data.ucetni_kod_confidence ?? 0} />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg text-sm">
            {data.ucetni_kod}
          </span>
          <span className="text-gray-700 text-sm">{data.ucetni_kod_nazev}</span>
        </div>
        <button
          onClick={() => setShowCode(!showCode)}
          className="mt-2 text-xs text-gray-400 underline hover:text-gray-600"
        >
          {showCode ? 'Skrýt vysvětlení' : 'Proč tento kód?'}
        </button>
        {showCode && (
          <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
            {data.ucetni_kod_duvod}
          </p>
        )}
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Změnit kód ručně
          </label>
          <input
            type="text"
            value={data.ucetni_kod ?? ''}
            onChange={(e) => setData({ ...data, ucetni_kod: e.target.value })}
            placeholder="např. 518"
            className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <p className="text-red-700 text-sm">{error}</p>
          {data.is_duplicate && (
            <button
              onClick={() => handleApprove(true)}
              disabled={isSending}
              className="text-sm text-orange-700 underline font-medium"
            >
              Přesto odeslat (potvrzuji duplicitu)
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleApprove(false)}
          disabled={isSending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {isSending ? 'Odesílám…' : '✓ Odeslat do účetního systému'}
        </button>
        <button
          onClick={handleReject}
          disabled={isRejecting}
          className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition-colors text-sm font-medium"
        >
          Zahodit
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Po schválení si aplikace zapamatuje účetní kód pro tohoto dodavatele.
      </p>
    </div>
  )
}
