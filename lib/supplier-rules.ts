import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExtractedInvoice } from '@/lib/claude'

export type SupplierRule = {
  id: string
  workspace_id: string
  dodavatel_ico: string | null
  dodavatel_nazev: string
  ucetni_kod: string
  ucetni_kod_nazev: string | null
  times_used: number
}

export async function lookupSupplierRule(
  supabase: SupabaseClient,
  workspaceId: string,
  ico: string | null | undefined,
  name: string | null | undefined
): Promise<SupplierRule | null> {
  const normalizedIco = ico?.replace(/\D/g, '').trim()
  if (normalizedIco && normalizedIco.length >= 8) {
    const { data } = await supabase
      .from('supplier_accounting_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('dodavatel_ico', normalizedIco)
      .maybeSingle()
    if (data) return data as SupplierRule
  }

  const normalizedName = name?.trim()
  if (normalizedName) {
    const { data } = await supabase
      .from('supplier_accounting_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .ilike('dodavatel_nazev', normalizedName)
      .maybeSingle()
    if (data) return data as SupplierRule
  }

  return null
}

export function applySupplierRule(
  extracted: ExtractedInvoice,
  rule: SupplierRule
): ExtractedInvoice {
  return {
    ...extracted,
    ucetni_kod: rule.ucetni_kod,
    ucetni_kod_nazev: rule.ucetni_kod_nazev ?? extracted.ucetni_kod_nazev,
    ucetni_kod_duvod: `Paměť dodavatele — dříve použito ${rule.times_used}× pro „${rule.dodavatel_nazev}".`,
    ucetni_kod_confidence: 0.97,
    problemy: [
      ...(extracted.problemy ?? []),
      `Účetní kód ${rule.ucetni_kod} z paměti dodavatele.`,
    ],
  }
}

export async function saveSupplierRule(
  supabase: SupabaseClient,
  workspaceId: string,
  ico: string | null | undefined,
  name: string | null | undefined,
  ucetniKod: string,
  ucetniKodNazev: string | null | undefined
): Promise<void> {
  const normalizedIco = ico?.replace(/\D/g, '').trim() || null
  const supplierName = name?.trim() || 'Neznámý dodavatel'

  if (normalizedIco) {
    const { data: existing } = await supabase
      .from('supplier_accounting_rules')
      .select('id, times_used')
      .eq('workspace_id', workspaceId)
      .eq('dodavatel_ico', normalizedIco)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('supplier_accounting_rules')
        .update({
          ucetni_kod: ucetniKod,
          ucetni_kod_nazev: ucetniKodNazev,
          dodavatel_nazev: supplierName,
          times_used: (existing.times_used ?? 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      return
    }

    await supabase.from('supplier_accounting_rules').insert({
      workspace_id: workspaceId,
      dodavatel_ico: normalizedIco,
      dodavatel_nazev: supplierName,
      ucetni_kod: ucetniKod,
      ucetni_kod_nazev: ucetniKodNazev,
    })
    return
  }

  await supabase.from('supplier_accounting_rules').insert({
    workspace_id: workspaceId,
    dodavatel_nazev: supplierName,
    ucetni_kod: ucetniKod,
    ucetni_kod_nazev: ucetniKodNazev,
  })
}

export async function listSupplierRules(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierRule[]> {
  const { data } = await supabase
    .from('supplier_accounting_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('times_used', { ascending: false })
  return (data ?? []) as SupplierRule[]
}
