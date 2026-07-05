import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractInvoiceFromPdf } from '@/lib/claude'
import { resolveInvoiceAllowance } from '@/lib/account-mode'
import { getActiveWorkspace } from '@/lib/workspace'
import type { CountryCode } from '@/lib/accounting-codes'
import { getDefaultCurrency } from '@/lib/accounting-codes'
import { runInvoiceAudit } from '@/lib/invoice-audit/run-audit'
import { getSupplierRule } from '@/lib/supplier-rules'
import { insertAuditLog } from '@/lib/audit-log'

const ALLOWED_VAT_RATES = [0, 10, 12, 20, 21] as const

function normalizeVatRate(rate: number | null | undefined, country: CountryCode): number {
  const fallback = country === 'sk' ? 20 : 21
  if (rate == null || Number.isNaN(rate)) return fallback
  const rounded = Math.round(rate)
  if ((ALLOWED_VAT_RATES as readonly number[]).includes(rounded)) return rounded
  return ALLOWED_VAT_RATES.reduce((best, candidate) =>
    Math.abs(candidate - rounded) < Math.abs(best - rounded) ? candidate : best
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count } = await supabase
    .from('processed_invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', firstOfMonth)

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('plan, invoice_credits, is_accountant, stripe_subscription_id, country, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const allowance = resolveInvoiceAllowance(profile, count ?? 0)

  if (!allowance.allowed) {
    return NextResponse.json({ error: allowance.message }, { status: 429 })
  }

  const country = ((profile as { country?: string } | null)?.country ?? 'cz') as CountryCode

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    (profile as { full_name?: string } | null)?.full_name
  )

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Chybí soubor' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Nahraj prosím PDF soubor' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Soubor je příliš velký (max 10 MB)' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  let extracted
  try {
    extracted = await extractInvoiceFromPdf(base64, country)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chyba při vytěžení faktury'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const supplierRule = await getSupplierRule(
    supabase,
    user.id,
    workspace.id,
    extracted.dodavatel_ico
  )

  if (supplierRule) {
    extracted = {
      ...extracted,
      ucetni_kod: supplierRule.default_ucetni_kod,
      ucetni_kod_nazev: supplierRule.default_ucetni_kod_nazev ?? extracted.ucetni_kod_nazev,
      ucetni_kod_duvod: `Dodavatel známý z minula (${supplierRule.use_count}× schváleno). ${extracted.ucetni_kod_duvod}`,
      ucetni_kod_confidence: Math.max(extracted.ucetni_kod_confidence, 0.92),
    }
  }

  const sazbaDph = normalizeVatRate(extracted.sazba_dph, country)

  const auditResult = await runInvoiceAudit(
    {
      dodavatel_nazev: extracted.dodavatel_nazev,
      dodavatel_ico: extracted.dodavatel_ico,
      dodavatel_dic: extracted.dodavatel_dic,
      cislo_faktury: extracted.cislo_faktury,
      datum_vystaveni: extracted.datum_vystaveni,
      datum_splatnosti: extracted.datum_splatnosti,
      variabilni_symbol: extracted.variabilni_symbol,
      castka_bez_dph: extracted.castka_bez_dph,
      sazba_dph: sazbaDph,
      castka_dph: extracted.castka_dph,
      castka_celkem: extracted.castka_celkem,
      ucetni_kod: extracted.ucetni_kod,
      je_prenesena_dan: extracted.je_prenesena_dan,
    },
    country,
    {
      supabase,
      userId: user.id,
      workspaceId: workspace.id,
    }
  )

  const status = auditResult.hasCritical ? 'needs_manual_check' : 'pending_review'

  const { data: invoice, error: dbErr } = await supabase
    .from('processed_invoices')
    .insert({
      user_id: user.id,
      workspace_id: workspace.id,
      dodavatel_nazev: extracted.dodavatel_nazev,
      dodavatel_ico: extracted.dodavatel_ico,
      dodavatel_dic: extracted.dodavatel_dic,
      cislo_faktury: extracted.cislo_faktury,
      datum_vystaveni: extracted.datum_vystaveni,
      datum_splatnosti: extracted.datum_splatnosti,
      variabilni_symbol: extracted.variabilni_symbol,
      castka_bez_dph: extracted.castka_bez_dph,
      sazba_dph: sazbaDph,
      castka_dph: extracted.castka_dph,
      castka_celkem: extracted.castka_celkem,
      mena: extracted.mena ?? getDefaultCurrency(country),
      popis_plneni: extracted.popis_plneni,
      iban: extracted.iban,
      ucetni_kod: extracted.ucetni_kod,
      ucetni_kod_nazev: extracted.ucetni_kod_nazev,
      ucetni_kod_duvod: extracted.ucetni_kod_duvod,
      ucetni_kod_confidence: extracted.ucetni_kod_confidence,
      confidence: extracted.confidence,
      problemy: extracted.problemy ?? [],
      raw_extraction: extracted as unknown as Record<string, unknown>,
      original_filename: file.name,
      status,
      audit_result: auditResult,
      audit_score: auditResult.score,
    })
    .select()
    .single()

  if (dbErr || !invoice) {
    console.error('[extract] DB insert failed:', dbErr?.message, dbErr?.code, dbErr?.details)
    return NextResponse.json(
      {
        error: dbErr?.message
          ? `Chyba při ukládání do databáze: ${dbErr.message}`
          : 'Chyba při ukládání do databáze',
      },
      { status: 500 }
    )
  }

  if (allowance.source === 'credit') {
    const credits = profile?.invoice_credits ?? 0
    await admin
      .from('user_profiles')
      .update({ invoice_credits: Math.max(0, credits - 1) })
      .eq('id', user.id)
  }

  await insertAuditLog({
    invoice_id: invoice.id,
    user_id: user.id,
    action: 'extracted',
    details: {
      confidence: extracted.confidence,
      ucetni_kod: extracted.ucetni_kod,
      filename: file.name,
      source: 'manual_upload',
      audit_score: auditResult.score,
      supplier_rule: !!supplierRule,
    },
  })

  return NextResponse.json({ invoice, audit: auditResult })
}
