'use client'

import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditCheck, AuditResult } from '@/lib/invoice-audit/types'

interface Props {
  audit: AuditResult | null
}

const ICON = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
} as const

const STYLE = {
  ok: 'text-green-700 bg-green-50 border-green-100',
  warning: 'text-amber-800 bg-amber-50 border-amber-100',
  critical: 'text-red-800 bg-red-50 border-red-100',
} as const

function CheckRow({ check }: { check: AuditCheck }) {
  const Icon = ICON[check.severity]
  return (
    <li
      className={cn(
        'flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
        STYLE[check.severity]
      )}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">{check.label}</p>
        <p className="text-xs opacity-90 mt-0.5">{check.message}</p>
      </div>
    </li>
  )
}

export function InvoiceAuditPanel({ audit }: Props) {
  if (!audit || audit.checks.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div
        className={cn(
          'px-5 py-4 border-b flex items-center justify-between gap-3',
          audit.hasCritical
            ? 'bg-red-50 border-red-100'
            : audit.hasWarning
              ? 'bg-amber-50 border-amber-100'
              : 'bg-green-50 border-green-100'
        )}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={cn(
              'h-5 w-5',
              audit.hasCritical
                ? 'text-red-600'
                : audit.hasWarning
                  ? 'text-amber-600'
                  : 'text-green-600'
            )}
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">Účetní audit faktury</p>
            <p className="text-xs text-gray-600">
              {audit.passedCount}/{audit.totalCount} kontrol prošlo
              {audit.hasCritical && ' · opravte červené položky před odesláním'}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'text-2xl font-bold tabular-nums',
            audit.hasCritical
              ? 'text-red-600'
              : audit.hasWarning
                ? 'text-amber-600'
                : 'text-green-600'
          )}
        >
          {audit.score}%
        </div>
      </div>
      <ul className="p-4 space-y-2">
        {audit.checks.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </ul>
    </div>
  )
}
