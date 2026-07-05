import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { INVOICE_ACTIONABLE_STATUSES, type ProcessedInvoice } from '@/types/invoices'
import { runInvoiceAudit } from '@/lib/invoice-audit/run-audit'
import type { CountryCode } from '@/lib/accounting-codes'
import { insertAuditLog } from '@/lib/audit-log'
import { INVOICE_DELETABLE_STATUSES } from '@/lib/invoice-guards'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { data: existing } = await supabase
    .from('processed_invoices')
    .select('id, dodavatel_nazev, cislo_faktury, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 })

  if (!INVOICE_DELETABLE_STATUSES.includes(existing.status as (typeof INVOICE_DELETABLE_STATUSES)[number])) {
    return NextResponse.json(
      { error: 'Odeslanou fakturu nelze smazat. Kontaktujte podporu.' },
      { status: 400 }
    )
  }

  await insertAuditLog({
    invoice_id: id,
    user_id: user.id,
    action: 'deleted',
    details: {
      dodavatel_nazev: existing.dodavatel_nazev,
      cislo_faktury: existing.cislo_faktury,
      previous_status: existing.status,
    },
  })

  const { error } = await supabase.from('processed_invoices').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { data: existing } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 })

  const inv = existing as ProcessedInvoice
  if (!INVOICE_ACTIONABLE_STATUSES.includes(inv.status)) {
    return NextResponse.json({ error: 'Fakturu nelze upravit' }, { status: 400 })
  }

  const body = await req.json()
  const patch: Record<string, unknown> = {}

  const stringFields = [
    'dodavatel_nazev',
    'dodavatel_ico',
    'dodavatel_dic',
    'cislo_faktury',
    'datum_vystaveni',
    'datum_splatnosti',
    'variabilni_symbol',
    'popis_plneni',
    'iban',
    'ucetni_kod',
    'ucetni_kod_nazev',
    'mena',
  ] as const

  for (const key of stringFields) {
    if (body[key] !== undefined) patch[key] = body[key]
  }

  const numericFields = ['castka_bez_dph', 'castka_dph', 'castka_celkem', 'sazba_dph'] as const
  for (const key of numericFields) {
    if (body[key] !== undefined) {
      const num = Number(body[key])
      if (Number.isNaN(num)) {
        return NextResponse.json({ error: `Neplatná hodnota pole ${key}` }, { status: 400 })
      }
      patch[key] = num
    }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('country')
    .eq('id', user.id)
    .maybeSingle()

  const country = ((profile as { country?: string } | null)?.country ?? 'cz') as CountryCode

  const merged = { ...inv, ...patch } as ProcessedInvoice

  const auditResult = await runInvoiceAudit(
    {
      dodavatel_nazev: merged.dodavatel_nazev,
      dodavatel_ico: merged.dodavatel_ico,
      dodavatel_dic: merged.dodavatel_dic,
      cislo_faktury: merged.cislo_faktury,
      datum_vystaveni: merged.datum_vystaveni,
      datum_splatnosti: merged.datum_splatnosti,
      variabilni_symbol: merged.variabilni_symbol,
      castka_bez_dph: merged.castka_bez_dph,
      sazba_dph: merged.sazba_dph,
      castka_dph: merged.castka_dph,
      castka_celkem: merged.castka_celkem,
      ucetni_kod: merged.ucetni_kod,
      je_prenesena_dan: Boolean(
        (merged.raw_extraction as Record<string, unknown> | null)?.je_prenesena_dan
      ),
    },
    country,
    {
      supabase,
      userId: user.id,
      workspaceId: merged.workspace_id,
      excludeInvoiceId: id,
    }
  )

  patch.audit_result = auditResult
  patch.audit_score = auditResult.score
  patch.status = auditResult.hasCritical ? 'needs_manual_check' : 'pending_review'

  const { data: updated, error } = await supabase
    .from('processed_invoices')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invoice: updated, audit: auditResult })
}
