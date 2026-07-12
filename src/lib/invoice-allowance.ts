import { createAdminClient } from '@/lib/supabase/admin'

export type AllowanceSource = 'pro' | 'credit' | 'free_monthly'

type ReserveResult =
  | { ok: true; source: AllowanceSource }
  | { ok: false; message: string }

export async function reserveInvoiceAllowance(userId: string): Promise<ReserveResult> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('reserve_invoice_allowance', {
    p_user_id: userId,
  })

  if (error) {
    console.error('[allowance] reserve failed:', error.message)
    return { ok: false, message: 'Nepodařilo se ověřit limit faktur. Zkuste to znovu.' }
  }

  const result = data as { ok?: boolean; source?: AllowanceSource; message?: string }
  if (!result?.ok) {
    return { ok: false, message: result?.message ?? 'Limit faktur vyčerpán.' }
  }

  return { ok: true, source: result.source ?? 'free_monthly' }
}

/** Vrátí rezervaci jen při selhání extrakce před uložením faktury — ne při smazání. */
export async function releaseInvoiceReservation(
  userId: string,
  source: AllowanceSource
): Promise<void> {
  if (source === 'pro' || source === 'credit') return
  const admin = createAdminClient()
  await admin.rpc('release_invoice_reservation', {
    p_user_id: userId,
    p_source: source,
  })
}

/** Trvale započítá spotřebu po úspěšném vytěžení (kredit / měsíční slot). */
export async function confirmInvoiceUsage(params: {
  userId: string
  workspaceId: string
  source: AllowanceSource
  invoiceId: string
}): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc('confirm_invoice_usage', {
    p_user_id: params.userId,
    p_workspace_id: params.workspaceId,
    p_source: params.source,
    p_invoice_id: params.invoiceId,
  })
  if (error) {
    console.error('[allowance] confirm usage failed:', error.message)
    throw new Error('Nepodařilo se započítat spotřebu faktury')
  }
}

export async function countInvoiceUsageFromLedger(
  userId: string,
  filter?: { allowanceSource?: AllowanceSource; fromDate?: Date }
): Promise<number> {
  const admin = createAdminClient()
  let query = admin
    .from('invoice_usage_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (filter?.allowanceSource) {
    query = query.eq('allowance_source', filter.allowanceSource)
  }
  if (filter?.fromDate) {
    query = query.gte('created_at', filter.fromDate.toISOString())
  }

  const { count, error } = await query
  if (error) {
    console.error('[allowance] count ledger usage failed:', error.message)
    return 0
  }
  return count ?? 0
}

function startOfCurrentMonthUtc(): Date {
  const firstOfMonth = new Date()
  firstOfMonth.setUTCDate(1)
  firstOfMonth.setUTCHours(0, 0, 0, 0)
  return firstOfMonth
}

export async function countMonthlyUsageFromLedger(userId: string): Promise<number> {
  return countInvoiceUsageFromLedger(userId, { fromDate: startOfCurrentMonthUtc() })
}

export async function countCreditUsageFromLedger(userId: string): Promise<number> {
  return countInvoiceUsageFromLedger(userId, { allowanceSource: 'credit' })
}

export async function countMonthlyFreeUsage(userId: string): Promise<number> {
  return countInvoiceUsageFromLedger(userId, {
    allowanceSource: 'free_monthly',
    fromDate: startOfCurrentMonthUtc(),
  })
}

/** @deprecated Použijte confirmInvoiceUsage */
export async function confirmFreeInvoiceReservation(userId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc('confirm_free_invoice_reservation', { p_user_id: userId })
}
