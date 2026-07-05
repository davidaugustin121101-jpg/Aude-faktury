import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeIco } from '@/lib/invoice-audit/rules/ico-format-check'

export type SupplierRule = {
  id: string
  ico: string
  dodavatel_nazev: string | null
  default_ucetni_kod: string
  default_ucetni_kod_nazev: string | null
  note: string | null
  use_count: number
}

export async function getSupplierRule(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  ico: string | null | undefined
): Promise<SupplierRule | null> {
  const normalized = normalizeIco(ico)
  if (!normalized) return null

  let query = supabase
    .from('supplier_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('ico', normalized)

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data } = await query.maybeSingle()
  return data as SupplierRule | null
}

export async function upsertSupplierRule(
  supabase: SupabaseClient,
  params: {
    userId: string
    workspaceId: string | null
    ico: string
    dodavatelNazev: string | null
    ucetniKod: string
    ucetniKodNazev: string | null
  }
): Promise<void> {
  const normalized = normalizeIco(params.ico)
  if (!normalized) return

  const { data: existing } = await supabase
    .from('supplier_rules')
    .select('id, use_count')
    .eq('user_id', params.userId)
    .eq('ico', normalized)
    .eq('workspace_id', params.workspaceId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('supplier_rules')
      .update({
        default_ucetni_kod: params.ucetniKod,
        default_ucetni_kod_nazev: params.ucetniKodNazev,
        dodavatel_nazev: params.dodavatelNazev,
        use_count: (existing.use_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('supplier_rules').insert({
      user_id: params.userId,
      workspace_id: params.workspaceId,
      ico: normalized,
      dodavatel_nazev: params.dodavatelNazev,
      default_ucetni_kod: params.ucetniKod,
      default_ucetni_kod_nazev: params.ucetniKodNazev,
      use_count: 1,
    })
  }
}
