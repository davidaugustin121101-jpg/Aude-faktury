import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  value: number | null
  className?: string
}

export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  if (value === null) return null

  const pct = Math.round(value * 100)

  const color =
    pct >= 90
      ? 'text-green-700 bg-green-50 border-green-200'
      : pct >= 70
        ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
        : 'text-red-700 bg-red-50 border-red-200'

  const icon = pct >= 90 ? '✅' : pct >= 70 ? '⚠️' : '❌'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        color,
        className
      )}
    >
      {icon} {pct}%
    </span>
  )
}

interface FieldConfidenceProps {
  label: string
  value: string | null | undefined
  fieldConfidence?: number | null
  globalConfidence?: number | null
  inProblemy?: boolean
}

export function FieldRow({
  label,
  value,
  fieldConfidence,
  globalConfidence,
  inProblemy,
}: FieldConfidenceProps) {
  const conf = fieldConfidence ?? (inProblemy ? 0.6 : globalConfidence)

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 flex-1 truncate mx-3">
        {value ?? <span className="text-gray-400 italic">—</span>}
      </span>
      <ConfidenceBadge value={conf ?? null} />
    </div>
  )
}
