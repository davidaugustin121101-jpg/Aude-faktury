'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  invoiceId: string
  supplierName?: string | null
  redirectTo?: string
  variant?: 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default'
  className?: string
}

export function InvoiceDeleteButton({
  invoiceId,
  supplierName,
  redirectTo,
  variant = 'outline',
  size = 'sm',
  className,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const label = supplierName ? `fakturu od ${supplierName}` : 'tuto fakturu'
    if (!window.confirm(`Opravdu smazat ${label}? Tuto akci nelze vrátit.`)) return

    setLoading(true)
    const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' })
    setLoading(false)

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Smazání se nezdařilo' }))
      toast.error(error)
      return
    }

    toast.success('Faktura smazána')
    if (redirectTo) router.push(redirectTo)
    else router.refresh()
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={handleDelete}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      <span className="ml-2">Smazat</span>
    </Button>
  )
}
