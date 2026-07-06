'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function InvoiceSettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoApproveBelow, setAutoApproveBelow] = useState('')

  useEffect(() => {
    fetch('/api/invoices/settings')
      .then((r) => r.json())
      .then(({ settings }) => {
        if (settings) {
          setAutoApproveBelow(
            settings.auto_approve_below != null ? String(settings.auto_approve_below) : ''
          )
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/invoices/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autoApproveBelow: autoApproveBelow ? Number(autoApproveBelow) : null,
      }),
    })
    setSaving(false)
    if (res.ok) toast.success('Nastavení faktur uloženo')
    else toast.error('Uložení se nezdařilo')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Faktury</p>

      <label className="block text-sm">
        <span className="text-gray-700 font-medium">Auto-odeslání do API do částky (Kč)</span>
        <p className="text-xs text-gray-500 mt-0.5 mb-1">
          Faktury pod touto částkou bez kritického auditu se automaticky odešlou do připojeného
          fakturačního systému (iDoklad / Fakturoid / SuperFaktura). Prázdné = vypnuto.
        </p>
        <input
          type="number"
          min={0}
          value={autoApproveBelow}
          onChange={(e) => setAutoApproveBelow(e.target.value)}
          placeholder="např. 5000"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </label>

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Uložit
      </Button>
    </div>
  )
}
