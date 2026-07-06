'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadInvoicePdf } from '@/lib/invoice-upload'
import { hasPendingPdf, takePendingPdf } from '@/lib/pending-upload'

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
      // #region agent log
      fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',location:'AutoUploadOnMount.tsx:run-start',message:'auto upload start',data:{auto,pending},timestamp:Date.now(),hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
      if (!pending) return

      const file = await takePendingPdf()
      // #region agent log
      fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',location:'AutoUploadOnMount.tsx:take-pdf',message:'pending pdf taken',data:{hasFile:!!file,fileType:file?.type,fileName:file?.name,fileSize:file?.size},timestamp:Date.now(),hypothesisId:'A,E'})}).catch(()=>{});
      // #endregion
      if (!file) return

      setProcessing(true)
      try {
        const result = await uploadInvoicePdf(file)
        // #region agent log
        fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',location:'AutoUploadOnMount.tsx:upload-result',message:'upload finished',data:{ok:result.ok,error:result.ok?undefined:result.error,invoiceId:result.ok?result.invoiceId:undefined},timestamp:Date.now(),hypothesisId:'B,D,F'})}).catch(()=>{});
        // #endregion

        if (!result.ok) {
          toast.error(result.error)
          return
        }

        toast.success('Faktura zpracována')
        router.replace(`/faktury/${result.invoiceId}`)
        router.refresh()
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',location:'AutoUploadOnMount.tsx:upload-error',message:'upload threw',data:{error:err instanceof Error?err.message:'unknown'},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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
