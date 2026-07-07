import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeIco } from '@/lib/invoice-audit/rules/ico-format-check'

export type DuplicateMatch = {
  id: string
  dodavatel_nazev: string | null
  cislo_faktury: string | null
  variabilni_symbol: string | null
  castka_celkem: number | null
  status: string
  created_at: string | null
}

export type DuplicateCheckInput = {
  dodavatel_ico: string | null
  cislo_faktury: string | null
  variabilni_symbol: string | null
  castka_celkem: number | null
}

const ACTIVE_STATUSES = [
  'sent_to_accounting',
  'pending_review',
  'needs_manual_check',
  'error',
  'approved',
] as const

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function amountsMatch(a: number | null | undefined, b: number | null | undefined): boolean {
  if (a == null || b == null) return false
  return Math.abs(round2(Number(a)) - round2(Number(b))) < 0.02
}

function documentKey(data: DuplicateCheckInput): string | null {
  const cislo = data.cislo_faktury?.trim()
  if (cislo) return cislo
  const vs = data.variabilni_symbol?.trim()
  if (vs) return vs
  return null
}

export async function findDuplicateInvoice(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  data: DuplicateCheckInput,
  excludeInvoiceId?: string
): Promise<DuplicateMatch | null> {
  const ico = normalizeIco(data.dodavatel_ico)
  const docKey = documentKey(data)
  const total = data.castka_celkem

  if (!ico || !docKey || total == null || Number.isNaN(Number(total))) {
    return null
  }

  let query = supabase
    .from('processed_invoices')
    .select(
      'id, dodavatel_nazev, cislo_faktury, variabilni_symbol, castka_celkem, status, created_at'
    )
    .eq('user_id', userId)
    .eq('dodavatel_ico', ico)
    .in('status', [...ACTIVE_STATUSES])

  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  if (excludeInvoiceId) query = query.neq('id', excludeInvoiceId)

  const cislo = data.cislo_faktury?.trim()
  if (cislo) {
    query = query.eq('cislo_faktury', cislo)
  } else {
    query = query.eq('variabilni_symbol', data.variabilni_symbol!.trim())
  }

  const { data: rows } = await query.limit(10)
  if (!rows?.length) return null

  const match = rows.find((r) => amountsMatch(r.castka_celkem, total))
  return (match as DuplicateMatch | undefined) ?? null
}

export function formatDuplicateMessage(match: DuplicateMatch): string {
  const doc = match.cislo_faktury ?? match.variabilni_symbol ?? '—'
  const supplier = match.dodavatel_nazev ?? 'dodavatele'
  const amount =
    match.castka_celkem != null
      ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(
          Number(match.castka_celkem)
        )
      : ''
  if (match.status === 'sent_to_accounting') {
    return `Stejná faktura (IČO + číslo/VS + částka ${amount}) od ${supplier} už byla odeslána do účetnictví (č. ${doc}).`
  }
  return `Možná duplicita: faktura č. ${doc} od ${supplier} se stejnou částkou ${amount} už existuje.`
}
