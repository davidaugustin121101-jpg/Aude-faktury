'use client'

import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { uploadInvoicePdf, type UploadProgressHandler } from '@/lib/invoice-upload'
import { PDF_MAX_BYTES } from '@/lib/pdf-limits'
import { InvoiceExtractionProgress } from '@/components/invoices/InvoiceExtractionProgress'
import { EXTRACTION_PROGRESS } from '@/lib/extraction-progress'

export function DropZone() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressLabel, setProgressLabel] = useState<string>(EXTRACTION_PROGRESS.hash.label)
  const uploadingRef = useRef(false)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file || uploadingRef.current) return

      uploadingRef.current = true
      setUploading(true)
      setFileName(file.name)
      setProgressPercent(2)
      setProgressLabel('Nahrávám soubor…')

      const handleProgress: UploadProgressHandler = (update) => {
        setProgressPercent(update.percent)
        setProgressLabel(update.label)
      }

      try {
        const result = await uploadInvoicePdf(file, handleProgress)
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
        setProgressPercent(0)
        setProgressLabel(EXTRACTION_PROGRESS.hash.label)
      }
    },
    [router]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: PDF_MAX_BYTES,
    disabled: uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30',
        uploading && 'pointer-events-none opacity-70'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        {uploading ? (
          <InvoiceExtractionProgress
            percent={progressPercent}
            label={progressLabel}
            fileName={fileName}
          />
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
                {isDragActive ? 'Pusť soubor sem' : 'Přetáhni PDF fakturu sem'}
              </p>
              <p className="text-sm text-gray-500 mt-1">nebo klikni pro výběr souboru · max 5 MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
