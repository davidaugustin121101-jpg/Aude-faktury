import ConfidenceBadge from './ConfidenceBadge'

interface AccountingCodeBadgeProps {
  code: string
  name: string
  reason: string
  confidence: number
}

export default function AccountingCodeBadge({
  code,
  name,
  reason,
  confidence,
}: AccountingCodeBadgeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Navržený účetní kód
        </p>
        <ConfidenceBadge value={confidence} />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg text-sm">
          {code}
        </span>
        <span className="text-gray-700 text-sm">{name}</span>
      </div>
      <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
        {reason}
      </p>
    </div>
  )
}
