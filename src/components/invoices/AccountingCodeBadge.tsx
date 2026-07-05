'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ConfidenceBadge } from './ConfidenceBadge'

interface AccountingCodeBadgeProps {
  kod: string
  nazev: string
  duvod: string
  confidence: number
}

export function AccountingCodeBadge({ kod, nazev, duvod, confidence }: AccountingCodeBadgeProps) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center bg-blue-50 text-blue-700 font-mono font-bold px-3 py-1 rounded-lg text-sm border border-blue-100">
          {kod}
        </span>
        <span className="text-gray-700 text-sm font-medium">{nazev}</span>
        <ConfidenceBadge value={confidence} />
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showDetail ? (
            <>
              Skrýt <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Proč tento kód? <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      </div>
      {showDetail && duvod && (
        <div className="text-xs text-gray-600 bg-blue-50/60 border border-blue-100 rounded-lg p-3 leading-relaxed">
          {duvod}
        </div>
      )}
    </div>
  )
}
