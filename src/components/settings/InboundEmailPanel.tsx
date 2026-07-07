'use client'

import { useEffect, useState } from 'react'
import { Copy, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function InboundEmailPanel() {
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/inbound-email')
      .then((r) => r.json())
      .then((data) => {
        if (data.address) setAddress(data.address)
      })
      .finally(() => setLoading(false))
  }, [])

  async function copyAddress() {
    if (!address) return
    await navigator.clipboard.writeText(address)
    toast.success('Adresa zkopírována')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!address) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-semibold text-gray-900">E-mailový vstup faktur</p>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        Pošlete fakturu jako PDF přílohu na vaši unikátní adresu — zpracujeme ji stejně jako při
        drag &amp; drop nahrání.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 break-all">
          {address}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copyAddress} className="shrink-0">
          <Copy className="h-4 w-4 mr-2" />
          Kopírovat
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Příchozí e-mail musí obsahovat alespoň jednu PDF přílohu (max 10 MB).
      </p>
    </div>
  )
}
