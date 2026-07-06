'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { uploadInvoicePdf } from '@/lib/invoice-upload'
import { hasPendingPdf, takePendingPdf } from '@/lib/pending-upload'

async function waitForSession(maxAttempts = 20): Promise<boolean> {
  const supabase = createClient()
  for (let i = 0; i < maxAttempts; i++) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) return true
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return false
}

export function AutoUploadOnMount() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const startedRef = useRef(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function run() {
      const auto = searchParams.get('auto') === '1'
      const pending = auto || (await hasPendingPdf())
      if (!pending) return

      if (auto) {
        const sessionReady = await waitForSession()
        if (!sessionReady) {
          toast.error('Přihlášení se nepodařilo načíst. Obnovte stránku a zkuste znovu.')
          return
        }
      }

      const file = await takePendingPdf()
      if (!file) {
        if (auto) {
          toast.error('Uložená faktura se nenašla. Nahrajte PDF znovu.')
        }
        return
      }

      setProcessing(true)
      try {
        const result = await uploadInvoicePdf(file)

        if (!result.ok) {
          toast.error(result.error)
          return
        }

        toast.success('Faktura zpracována')
        router.replace(`/faktury/${result.invoiceId}`)
        router.refresh()
      } catch {
        toast.error('Nahrání se nezdařilo. Zkuste PDF nahrát znovu.')
      } finally {
        setProcessing(false)
      }
    }

    void run()
  }, [router, searchParams])

  if (!processing) return null

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-center gap-3">
      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      <p className="text-sm font-medium text-blue-900">Zpracováváme vaši fakturu…</p>
    </div>
  )
}
