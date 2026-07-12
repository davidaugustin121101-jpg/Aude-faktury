'use client'

import { Progress, ProgressLabel } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

type Props = {
  percent: number
  label: string
  fileName?: string | null
}

export function InvoiceExtractionProgress({ percent, label, fileName }: Props) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)))

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      <div className="w-full space-y-3">
        <Progress value={clamped} className="w-full">
          <div className="flex w-full items-center justify-between gap-3">
            <ProgressLabel className="text-sm font-semibold text-gray-900">{label}</ProgressLabel>
            <span className="text-sm font-semibold text-blue-600 tabular-nums">{clamped} %</span>
          </div>
        </Progress>
        {fileName ? <p className="text-xs text-gray-500 text-center truncate">{fileName}</p> : null}
      </div>
    </div>
  )
}
