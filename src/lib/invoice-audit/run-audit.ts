import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuditCheck, AuditResult, InvoiceAuditInput } from './types'
import { checkMath } from './rules/math-check'
import { checkVat } from './rules/vat-check'
import { checkDates } from './rules/date-check'
import { checkAssetThreshold } from './rules/asset-threshold'
import { checkIcoFormat } from './rules/ico-format-check'
import { checkAres } from './rules/ares-lookup'
import { checkDuplicate } from './rules/duplicate-check'

export type RunAuditOptions = {
  supabase?: SupabaseClient
  userId?: string
  workspaceId?: string | null
  excludeInvoiceId?: string
  skipAres?: boolean
}

function scoreChecks(checks: AuditCheck[]): AuditResult {
  const passedCount = checks.filter((c) => c.severity === 'ok').length
  const totalCount = checks.length
  const hasCritical = checks.some((c) => c.severity === 'critical')
  const hasWarning = checks.some((c) => c.severity === 'warning')
  const score =
    totalCount === 0 ? 0 : Math.round((passedCount / totalCount) * 100)

  return {
    checks,
    score,
    passedCount,
    totalCount,
    hasCritical,
    hasWarning,
  }
}

export async function runInvoiceAudit(
  data: InvoiceAuditInput,
  options: RunAuditOptions = {}
): Promise<AuditResult> {
  const checks: AuditCheck[] = [
    checkMath(data),
    checkVat(data),
    checkDates(data),
    checkIcoFormat(data),
    checkAssetThreshold(data),
  ]

  if (!options.skipAres) {
    checks.push(await checkAres(data))
  }

  if (options.supabase && options.userId) {
    checks.push(
      await checkDuplicate(
        options.supabase,
        options.userId,
        options.workspaceId ?? null,
        data,
        options.excludeInvoiceId
      )
    )
  }

  return scoreChecks(checks)
}
