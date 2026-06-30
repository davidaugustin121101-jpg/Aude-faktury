import type { SupabaseClient } from '@supabase/supabase-js'

export type DuplicateMatch = {
  id: string
  cislo_faktury: string | null
  dodavatel_nazev: string | null
  status: string
  created_at: string
}

export async function findDuplicateInvoice(
  supabase: SupabaseClient,
  workspaceId: string,
  ico: string | null | undefined,
  cisloFaktury: string | null | undefined,
  excludeId?: string
): Promise<DuplicateMatch | null> {
  const normalizedIco = ico?.replace(/\D/g, '').trim()
  const normalizedNumber = cisloFaktury?.trim()

  if (!normalizedIco || !normalizedNumber) return null

  let query = supabase
    .from('processed_invoices')
    .select('id, cislo_faktury, dodavatel_nazev, status, created_at')
    .eq('workspace_id', workspaceId)
    .eq('dodavatel_ico', normalizedIco)
    .eq('cislo_faktury', normalizedNumber)
    .in('status', ['pending_review', 'sent', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)

  if (excludeId) query = query.neq('id', excludeId)

  const { data } = await query.maybeSingle()
  return (data as DuplicateMatch) ?? null
}

export function duplicateWarningMessage(match: DuplicateMatch): string {
  const date = new Date(match.created_at).toLocaleDateString('cs-CZ')
  return `Možná duplicita — faktura ${match.cislo_faktury} od ${match.dodavatel_nazev ?? 'dodavatele'} už existuje (${match.status}, ${date}).`
}
