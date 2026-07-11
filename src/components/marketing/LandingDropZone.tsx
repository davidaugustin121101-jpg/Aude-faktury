'use client'

import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { uploadInvoicePdf } from '@/lib/invoice-upload'
import { savePendingPdf } from '@/lib/pending-upload'

interface Props {
  isAuthenticated: boolean
}

export function LandingDropZone({ isAuthenticated }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const uploadingRef = useRef(false)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file || uploadingRef.current) return

      uploadingRef.current = true
      setUploading(true)
      setFileName(file.name)

      try {
        if (!isAuthenticated) {
          const saved = await savePendingPdf(file)
          if (!saved) {
            toast.error('Soubor se nepodařilo uložit. Zkuste registraci a nahrajte PDF znovu.')
            router.push('/register')
            return
          }
          toast.success('Faktura uložena — dokončete registraci a hned ji zpracujeme')
          router.push('/register?pending=1')
          return
        }

        const result = await uploadInvoicePdf(file)
        if (!result.ok) {
          if (result.duplicate && result.existingInvoiceId) {
            toast.error(result.error, {
              action: {
                label: 'Otevřít fakturu',
                onClick: () => router.push(`/faktury/${result.existingInvoiceId}`),
              },
            })
          } else {
            toast.error(result.error)
          }
          return
        }

        toast.success('Faktura zpracována')
        router.push(`/faktury/${result.invoiceId}`)
        router.refresh()
      } catch {
        toast.error('Chyba při nahrávání')
      } finally {
        uploadingRef.current = false
        setUploading(false)
        setFileName(null)
      }
    },
    [isAuthenticated, router]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  })

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-colors bg-white/80',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-blue-200 hover:border-blue-400 hover:bg-white',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Zpracovávám fakturu…</p>
                {fileName && <p className="text-xs text-gray-500 mt-1">{fileName}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                {isDragActive ? (
                  <FileText className="h-7 w-7 text-blue-600" />
                ) : (
                  <Upload className="h-7 w-7 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {isDragActive ? 'Pusť fakturu sem' : 'Přetáhni PDF fakturu sem'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  nebo klikni pro výběr · max 10 MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-blue-800/80 mt-4 font-medium">
        {isAuthenticated
          ? 'Vytěžení + odeslání s PDF přílohou · 10 faktur měsíčně zdarma'
          : 'Po nahrání dokončíte registraci — PDF už bude uložené'}
      </p>
    </div>
  )
}
