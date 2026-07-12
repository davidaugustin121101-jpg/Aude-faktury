'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { providerDisplayName } from '@/lib/accounting-connection'
import { InvoiceEditForm } from '@/components/invoices/InvoiceEditForm'
import { InvoiceDeleteButton } from '@/components/invoices/InvoiceDeleteButton'
import type { ProcessedInvoice } from '@/types/invoices'

interface Props {
  invoiceId: string
  invoice: ProcessedInvoice
  accountingProvider: string
  auditHasCritical?: boolean
  supplierName?: string | null
}

export function InvoiceActions({
  invoiceId,
  invoice,
  accountingProvider,
  auditHasCritical = false,
  supplierName,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rememberSupplier, setRememberSupplier] = useState(true)
  const [forceSend, setForceSend] = useState(false)
  const [editing, setEditing] = useState(false)

  const providerLabel = providerDisplayName(accountingProvider)
  const sendBlocked = auditHasCritical && !forceSend

  async function handleSend() {
    if (sendBlocked) {
      toast.error('Opravte kritické položky v auditu, nebo potvrďte odeslání navzdory varování.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/invoices/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, rememberSupplier, forceSend }),
    })
    setLoading(false)
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.success(`Faktura odeslána do ${providerLabel}`)
      if (data.totalsSummary) toast.info(`iDoklad: ${data.totalsSummary}`)
      if (data.warning) toast.warning(data.warning)
      router.refresh()
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Neznámá chyba' }))
      toast.error(`Chyba: ${error}`)
    }
  }

  if (editing) {
    return <InvoiceEditForm invoice={invoice} onClose={() => setEditing(false)} />
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Odeslat do {providerLabel}
      </p>

      {auditHasCritical && (
        <label className="flex items-start gap-2 text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={forceSend}
            onChange={(e) => setForceSend(e.target.checked)}
            className="mt-1"
          />
          <span>
            Odeslat i přes kritické položky auditu (beru odpovědnost za správnost dat)
          </span>
        </label>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberSupplier}
          onChange={(e) => setRememberSupplier(e.target.checked)}
        />
        Zapamatovat účetní kód pro {supplierName ?? 'tohoto dodavatele'}
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          onClick={handleSend}
          disabled={loading || sendBlocked}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Odeslat do {providerLabel}
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-gray-300"
          disabled={loading}
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Upravit data
        </Button>
        <InvoiceDeleteButton
          invoiceId={invoiceId}
          supplierName={supplierName}
          redirectTo="/faktury"
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        />
      </div>
    </div>
  )
}
