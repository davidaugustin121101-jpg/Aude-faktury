'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  label: string
  priceLabel: string
  isAccountant: boolean
}

export function UpgradeButton({ label, priceLabel, isAccountant }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'accountant' }),
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
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{priceLabel}</p>
      </div>
      <Button
        size="sm"
        variant={isAccountant ? 'secondary' : 'default'}
        disabled={isAccountant || loading}
        onClick={handleUpgrade}
        className={!isAccountant ? 'bg-violet-600 hover:bg-violet-700' : undefined}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isAccountant ? (
          'Aktivní'
        ) : (
          'Aktivovat'
        )}
      </Button>
    </div>
  )
}
