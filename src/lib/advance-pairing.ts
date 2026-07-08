import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeIco } from '@/lib/invoice-audit/rules/ico-format-check'
import { effectiveAmountForPairing, isZalohovaTyp } from '@/lib/invoice-amounts'

export type AdvancePairMatch = {
  id: string
  dodavatel_nazev: string | null
  cislo_faktury: string | null
  castka_celkem: number | null
  status: string
  created_at: string | null
  typ_faktury: 'zalohova' | 'danovy_doklad'
}

export type AdvancePairCheckInput = {
  dodavatel_ico: string | null
  typ_faktury?: string | null
  typ_dokladu?: string | null
  castka_celkem?: number | null
  castka_k_uhrade?: number | null
  castka_bez_dph?: number | null
  castka_dph?: number | null
  polozky?: Array<{
    nazev: string
    mnozstvi: number
    jednotkova_cena: number
    sazba_dph: number
    typ: 'zbozi' | 'sluzba'
  }>
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

function amountsRelate(a: number, b: number): boolean {
  const diff = Math.abs(round2(a) - round2(b))
  if (diff < 1) return true
  const larger = Math.max(Math.abs(a), Math.abs(b))
  return larger > 0 && diff / larger < 0.03
}

function readTypFromRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as { typ_faktury?: string; typ_dokladu?: string }
  if (r.typ_faktury === 'zalohova' || r.typ_faktury === 'danovy_doklad') return r.typ_faktury
  if (r.typ_dokladu === 'proforma') return 'zalohova'
  return r.typ_faktury ?? null
}

function rowIsZalohova(row: { raw_extraction?: unknown }): boolean {
  const raw = (row.raw_extraction ?? {}) as { typ_faktury?: string; typ_dokladu?: string }
  return isZalohovaTyp(raw)
}

export async function findAdvancePairing(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  data: AdvancePairCheckInput,
  excludeInvoiceId?: string
): Promise<AdvancePairMatch | null> {
  const ico = normalizeIco(data.dodavatel_ico)
  if (!ico) return null

  const incomingIsZalohova = isZalohovaTyp(data)
  const incomingAmount = effectiveAmountForPairing(data)

  let query = supabase
    .from('processed_invoices')
    .select('id, dodavatel_nazev, cislo_faktury, castka_celkem, status, created_at, raw_extraction')
    .eq('user_id', userId)
    .eq('dodavatel_ico', ico)
    .in('status', [...ACTIVE_STATUSES])

  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  if (excludeInvoiceId) query = query.neq('id', excludeInvoiceId)

  const { data: rows } = await query.order('created_at', { ascending: false }).limit(40)
  if (!rows?.length) return null

  for (const row of rows) {
    const rowZalohova = rowIsZalohova(row)
    const typ = readTypFromRaw(row.raw_extraction) ?? (rowZalohova ? 'zalohova' : 'danovy_doklad')

    if (incomingIsZalohova && rowZalohova) continue
    if (!incomingIsZalohova && !rowZalohova) continue

    const rowRaw = (row.raw_extraction ?? {}) as AdvancePairCheckInput
    const rowAmount =
      effectiveAmountForPairing({
        castka_celkem: row.castka_celkem,
        ...rowRaw,
        polozky: rowRaw.polozky,
      }) ?? (row.castka_celkem != null ? Number(row.castka_celkem) : null)

    if (incomingAmount == null || rowAmount == null) continue
    if (!amountsRelate(incomingAmount, rowAmount)) continue

    return {
      id: row.id as string,
      dodavatel_nazev: row.dodavatel_nazev as string | null,
      cislo_faktury: row.cislo_faktury as string | null,
      castka_celkem: row.castka_celkem as number | null,
      status: row.status as string,
      created_at: row.created_at as string | null,
      typ_faktury: rowZalohova ? 'zalohova' : 'danovy_doklad',
    }
  }

  return null
}

export function formatAdvancePairMessage(
  match: AdvancePairMatch,
  incomingIsZalohova: boolean
): string {
  const doc = match.cislo_faktury ?? '—'
  const supplier = match.dodavatel_nazev ?? 'dodavatele'
  const amount =
    match.castka_celkem != null
      ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(
          Number(match.castka_celkem)
        )
      : 'podobnou částkou'

  if (incomingIsZalohova) {
    return `Od ${supplier} už existuje daňový doklad (č. ${doc}, ${amount}) — může jít o navazující vyúčtování této zálohy.`
  }

  return `Od ${supplier} existuje dřívější zálohová faktura (č. ${doc}, ${amount}) — zkontrolujte párování zálohy s tímto daňovým dokladem.`
}
