'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfidenceBadge from '@/components/ConfidenceBadge'

type QueueInvoice = {
  id: string
  dodavatel_nazev?: string | null
  cislo_faktury?: string | null
  castka_celkem?: number | null
  ucetni_kod?: string | null
  confidence?: number | null
  is_duplicate?: boolean
  ucetni_kod_duvod?: string | null
  created_at: string
}

export default function QueuePageClient({ initialInvoices }: { initialInvoices: QueueInvoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setInvoices(initialInvoices)
    setSelected(new Set(initialInvoices.map((i) => i.id)))
  }, [initialInvoices])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === invoices.length) setSelected(new Set())
    else setSelected(new Set(invoices.map((i) => i.id)))
  }

  const handleBatchApprove = async () => {
    if (selected.size === 0) return
    setIsSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/invoices/batch-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult(data.error ?? 'Hromadné odeslání selhalo.')
        return
      }
      setResult(`Odesláno ${data.succeeded} z ${data.total} faktur.`)
      router.refresh()
    } catch {
      setResult('Chyba při odesílání.')
    } finally {
      setIsSending(false)
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Fronta je prázdná — žádné faktury ke kontrole.</p>
        <Link
          href="/dashboard/upload"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          Nahrát faktury →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {invoices.length} faktur čeká na odeslání · vybráno {selected.size}
        </p>
        <button
          onClick={handleBatchApprove}
          disabled={isSending || selected.size === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
        >
          {isSending ? 'Odesílám…' : `Odeslat vybrané (${selected.size})`}
        </button>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm">
          {result}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === invoices.length && invoices.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3 font-medium">Dodavatel</th>
              <th className="p-3 font-medium">Číslo</th>
              <th className="p-3 font-medium">Částka</th>
              <th className="p-3 font-medium">Účet</th>
              <th className="p-3 font-medium">Jistota</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const fromMemory = (inv.ucetni_kod_duvod ?? '').includes('Paměť dodavatele')
              return (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(inv.id)}
                      onChange={() => toggle(inv.id)}
                    />
                  </td>
                  <td className="p-3 text-gray-900">
                    {inv.dodavatel_nazev ?? '—'}
                    {inv.is_duplicate && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                        duplicita
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-600">{inv.cislo_faktury ?? '—'}</td>
                  <td className="p-3">
                    {inv.castka_celkem != null
                      ? `${Number(inv.castka_celkem).toLocaleString('cs-CZ')} Kč`
                      : '—'}
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-blue-700">{inv.ucetni_kod ?? '—'}</span>
                    {fromMemory && (
                      <span className="ml-1 text-xs text-purple-600">paměť</span>
                    )}
                  </td>
                  <td className="p-3">
                    {inv.confidence != null && <ConfidenceBadge value={inv.confidence} />}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/dashboard/invoice/${inv.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
