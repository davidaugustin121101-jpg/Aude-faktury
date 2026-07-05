'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { CountryCode } from '@/lib/accounting-codes'
import { COUNTRY_LABELS } from '@/lib/accounting-codes'

interface Props {
  initialCountry: CountryCode
}

export function CountrySelector({ initialCountry }: Props) {
  const router = useRouter()
  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: CountryCode) {
    if (next === country) return
    setSaving(true)
    setCountry(next)
    const res = await fetch('/api/user/country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: next }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('Nepodařilo se uložit zemi')
      setCountry(country)
      return
    }
    toast.success(
      next === 'sk'
        ? 'Nastaveno Slovensko – účtovné kódy a SuperFaktúra'
        : 'Nastaveno Česko – účetní kódy'
    )
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Země účetnictví
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Určuje jazyk vytěžení, DPH sazby a účetní/účtovné kódy.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(['cz', 'sk'] as CountryCode[]).map((code) => (
          <button
            key={code}
            type="button"
            disabled={saving}
            onClick={() => handleChange(code)}
            className={cn(
              'rounded-xl border-2 p-4 text-left transition-all',
              country === code
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
            )}
          >
            <span className="text-2xl block mb-2">{code === 'cz' ? '🇨🇿' : '🇸🇰'}</span>
            <p className="text-sm font-semibold text-gray-900">{COUNTRY_LABELS[code]}</p>
            <p className="text-xs text-gray-500 mt-1">
              {code === 'cz' ? 'iDoklad · Fakturoid · SuperFaktura' : 'SuperFaktúra · EUR · DPH 0/10/20 %'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
