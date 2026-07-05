'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function DropZone() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return

      setUploading(true)
      setFileName(file.name)

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/extract', { method: 'POST', body: formData })
        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error ?? 'Nahrání se nezdařilo')
          return
        }

        toast.success('Faktura zpracována')
        router.push(`/faktury/${data.invoice.id}`)
        router.refresh()
      } catch {
        toast.error('Chyba při nahrávání')
      } finally {
        setUploading(false)
        setFileName(null)
      }
    },
    [router]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
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
                {isDragActive ? 'Pusť soubor sem' : 'Přetáhni PDF fakturu sem'}
              </p>
              <p className="text-sm text-gray-500 mt-1">nebo klikni pro výběr souboru · max 10 MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
