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

export async function releaseInvoiceReservation(
  userId: string,
  source: AllowanceSource
): Promise<void> {
  if (source === 'pro') return
  const admin = createAdminClient()
  await admin.rpc('release_invoice_reservation', {
    p_user_id: userId,
    p_source: source,
  })
}

export async function confirmFreeInvoiceReservation(userId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc('confirm_free_invoice_reservation', { p_user_id: userId })
}
