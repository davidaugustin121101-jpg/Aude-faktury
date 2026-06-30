export default function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round((value ?? 0) * 100)
  if (pct >= 90) {
    return (
      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
        ✓ {pct}%
      </span>
    )
  }
  if (pct >= 70) {
    return (
      <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
        ⚠ {pct}%
      </span>
    )
  }
  return (
    <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      ✗ {pct}% – zkontroluj
    </span>
  )
}
