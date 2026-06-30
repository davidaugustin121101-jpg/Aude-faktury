import Link from 'next/link'
import { PLANS, PlanKey } from '@/lib/stripe'

interface PlanBannerProps {
  plan: PlanKey
  used: number
}

export default function PlanBanner({ plan, used }: PlanBannerProps) {
  const config = PLANS[plan]
  const limit = config.limit
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const nearLimit = used >= limit * 0.8

  return (
    <div
      className={`rounded-xl border p-4 ${
        nearLimit ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">
          Plán <span className="text-blue-600">{config.name}</span>
        </p>
        <p className="text-sm text-gray-500">
          {used} / {limit === 999999 ? '∞' : limit} faktur tento měsíc
        </p>
      </div>
      {limit < 999999 && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${nearLimit ? 'bg-yellow-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {nearLimit && (
        <p className="text-xs text-yellow-700 mt-2">
          Blížíš se limitu.{' '}
          <Link href="/dashboard/settings" className="underline font-medium">
            Upgraduj plán
          </Link>
        </p>
      )}
    </div>
  )
}
