'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function DropZone({ batch = false }: { batch?: boolean }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      )

      if (list.length === 0) {
        setError('Nahraj prosím soubory ve formátu PDF.')
        return
      }

      for (const f of list) {
        if (f.size > 10 * 1024 * 1024) {
          setError(`Soubor ${f.name} je příliš velký (max 10 MB).`)
          return
        }
      }

      setIsLoading(true)
      setError(null)
      setProgress(null)

      if (batch || list.length > 1) {
        const formData = new FormData()
        list.forEach((f) => formData.append('files', f))

        try {
          setProgress(`Zpracovávám ${list.length} faktur…`)
          const res = await fetch('/api/extract/batch', { method: 'POST', body: formData })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error ?? 'Hromadné zpracování selhalo.')
            if (data.upgrade_required) setTimeout(() => router.push('/dashboard/settings'), 2000)
            return
          }
          router.push('/dashboard/queue')
        } catch {
          setError('Nepodařilo se připojit k serveru.')
        } finally {
          setIsLoading(false)
          setProgress(null)
        }
        return
      }

      const file = list[0]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/extract', { method: 'POST', body: formData })
        let data: {
          error?: string
          upgrade_required?: boolean
          invoice?: { id: string }
        } = {}
        try {
          data = await res.json()
        } catch {
          setError(`Server vrátil chybu (${res.status}).`)
          return
        }
        if (!res.ok) {
          setError(data.error ?? 'Při zpracování nastala chyba.')
          if (data.upgrade_required) setTimeout(() => router.push('/dashboard/settings'), 2000)
          return
        }
        if (!data.invoice?.id) {
          setError('Server nevrátil ID faktury.')
          return
        }
        router.push(`/dashboard/invoice/${data.invoice.id}`)
      } catch {
        setError('Nepodařilo se připojit k serveru.')
      } finally {
        setIsLoading(false)
      }
    },
    [router, batch]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-16 text-center
        transition-all duration-200 cursor-pointer select-none
        ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}
        ${isLoading ? 'pointer-events-none opacity-70' : ''}
      `}
    >
      <input
        id="file-input"
        type="file"
        accept="application/pdf"
        multiple={batch}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => {
          if (e.target.files?.length) processFiles(e.target.files)
        }}
        disabled={isLoading}
      />
      {isLoading ? (
        <div className="pointer-events-none">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="text-gray-700 font-semibold text-lg">
            {progress ?? 'Claude čte fakturu…'}
          </p>
          <p className="text-gray-400 text-sm mt-1">Obvykle do 5 sekund na fakturu</p>
        </div>
      ) : (
        <div className="pointer-events-none">
          <div className="text-5xl mb-4">📄</div>
          <p className="text-gray-800 font-semibold text-lg">
            {isDragging
              ? 'Pusť soubory zde'
              : batch
                ? 'Přetáhni PDF faktury sem (více najednou)'
                : 'Přetáhni PDF fakturu sem'}
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            {batch ? 'nebo klikni a vyber více souborů' : 'nebo klikni a vyber soubor'}
          </p>
          <p className="text-gray-300 text-xs mt-5">PDF do 10 MB · max 20 najednou</p>
        </div>
      )}
      {error && (
        <div className="mt-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 pointer-events-none">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}
