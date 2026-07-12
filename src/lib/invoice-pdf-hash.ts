import type { SupabaseClient } from '@supabase/supabase-js'
import type { DuplicateMatch } from '@/lib/duplicate-invoice'

const REUSABLE_STATUSES = [
  'sent_to_accounting',
  'pending_review',
  'needs_manual_check',
  'error',
  'approved',
  'sent',
] as const

export async function findInvoiceByPdfHash(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  pdfSha256: string
): Promise<DuplicateMatch | null> {
  if (!pdfSha256) return null

  let query = supabase
    .from('processed_invoices')
    .select(
      'id, dodavatel_nazev, cislo_faktury, variabilni_symbol, castka_celkem, status, created_at'
    )
    .eq('user_id', userId)
    .eq('pdf_sha256', pdfSha256)
    .in('status', [...REUSABLE_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data } = await query.maybeSingle()
  return (data as DuplicateMatch | null) ?? null
}

export function formatPdfHashDuplicateMessage(match: DuplicateMatch): string {
  const doc = match.cislo_faktury ?? match.variabilni_symbol ?? '—'
  const supplier = match.dodavatel_nazev ?? 'dodavatele'
  return `Tento PDF soubor už byl vytěžen (${supplier}, č. ${doc}). Otevřete existující fakturu ve fakturách.`
}
