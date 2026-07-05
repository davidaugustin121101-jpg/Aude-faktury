'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { ProcessedInvoice } from '@/types/invoices'

interface Props {
  invoice: ProcessedInvoice
  onClose: () => void
}

export function InvoiceEditForm({ invoice, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    dodavatel_nazev: invoice.dodavatel_nazev ?? '',
    dodavatel_ico: invoice.dodavatel_ico ?? '',
    dodavatel_dic: invoice.dodavatel_dic ?? '',
    cislo_faktury: invoice.cislo_faktury ?? '',
    datum_vystaveni: invoice.datum_vystaveni ?? '',
    datum_splatnosti: invoice.datum_splatnosti ?? '',
    variabilni_symbol: invoice.variabilni_symbol ?? '',
    castka_bez_dph: String(invoice.castka_bez_dph ?? ''),
    sazba_dph: String(invoice.sazba_dph ?? 21),
    castka_dph: String(invoice.castka_dph ?? ''),
    castka_celkem: String(invoice.castka_celkem ?? ''),
    ucetni_kod: invoice.ucetni_kod ?? '',
    ucetni_kod_nazev: invoice.ucetni_kod_nazev ?? '',
    popis_plneni: invoice.popis_plneni ?? '',
    iban: invoice.iban ?? '',
  })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setLoading(true)
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        castka_bez_dph: Number(form.castka_bez_dph),
        sazba_dph: Number(form.sazba_dph),
        castka_dph: Number(form.castka_dph),
        castka_celkem: Number(form.castka_celkem),
      }),
    })
    setLoading(false)

    if (res.ok) {
      toast.success('Faktura upravena')
      onClose()
      router.refresh()
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Chyba' }))
      toast.error(error)
    }
  }

  const fields: { key: keyof typeof form; label: string; type?: string }[] = [
    { key: 'dodavatel_nazev', label: 'Dodavatel' },
    { key: 'dodavatel_ico', label: 'IČO' },
    { key: 'dodavatel_dic', label: 'DIČ' },
    { key: 'cislo_faktury', label: 'Číslo faktury' },
    { key: 'datum_vystaveni', label: 'Datum vystavení', type: 'date' },
    { key: 'datum_splatnosti', label: 'Datum splatnosti', type: 'date' },
    { key: 'variabilni_symbol', label: 'Variabilní symbol' },
    { key: 'castka_bez_dph', label: 'Základ DPH', type: 'number' },
    { key: 'sazba_dph', label: 'Sazba DPH (%)', type: 'number' },
    { key: 'castka_dph', label: 'DPH', type: 'number' },
    { key: 'castka_celkem', label: 'Celkem', type: 'number' },
    { key: 'ucetni_kod', label: 'Účetní kód' },
    { key: 'ucetni_kod_nazev', label: 'Název účetního kódu' },
    { key: 'popis_plneni', label: 'Popis plnění' },
    { key: 'iban', label: 'IBAN' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Upravit fakturu</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ key, label, type = 'text' }) => (
          <label key={key} className="block text-sm">
            <span className="text-gray-500 text-xs">{label}</span>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading} className="flex-1">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Uložit změny
        </Button>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Zrušit
        </Button>
      </div>
    </div>
  )
}
