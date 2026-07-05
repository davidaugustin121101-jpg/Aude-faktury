import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeIco } from './ico-format-check'
import type { AuditCheck, InvoiceAuditInput } from '../types'

export async function checkDuplicate(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  data: InvoiceAuditInput,
  excludeInvoiceId?: string
): Promise<AuditCheck> {
  const ico = normalizeIco(data.dodavatel_ico)
  const cislo = data.cislo_faktury?.trim()

  if (!cislo) {
    return {
      id: 'duplicate',
      label: 'Duplicita',
      message: 'Chybí číslo faktury — nelze kontrolovat duplicitu.',
      severity: 'warning',
    }
  }

  let query = supabase
    .from('processed_invoices')
    .select('id, dodavatel_nazev, status, created_at')
    .eq('user_id', userId)
    .eq('cislo_faktury', cislo)
    .in('status', ['sent_to_accounting', 'pending_review', 'needs_manual_check', 'error'])

  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  if (ico) query = query.eq('dodavatel_ico', ico)
  if (excludeInvoiceId) query = query.neq('id', excludeInvoiceId)

  const { data: existing } = await query.limit(3)

  if (!existing || existing.length === 0) {
    return {
      id: 'duplicate',
      label: 'Duplicita',
      message: `Faktura č. ${cislo} od tohoto dodavatele zatím nebyla zpracována.`,
      severity: 'ok',
    }
  }

  const sent = existing.find((r) => r.status === 'sent_to_accounting')
  if (sent) {
    const date = sent.created_at
      ? new Intl.DateTimeFormat('cs-CZ').format(new Date(sent.created_at))
      : ''
    return {
      id: 'duplicate',
      label: 'Duplicita',
      message: `Faktura č. ${cislo} od ${data.dodavatel_nazev ?? 'dodavatele'} už byla odeslána${date ? ` (${date})` : ''}.`,
      severity: 'critical',
    }
  }

  return {
    id: 'duplicate',
    label: 'Duplicita',
    message: `Faktura č. ${cislo} je už ve frontě ke zpracování (${existing.length}×).`,
    severity: 'warning',
  }
}
