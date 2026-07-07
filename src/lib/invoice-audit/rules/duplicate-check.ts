import type { SupabaseClient } from '@supabase/supabase-js'
import {
  findDuplicateInvoice,
  formatDuplicateMessage,
  type DuplicateCheckInput,
} from '@/lib/duplicate-invoice'
import type { AuditCheck, InvoiceAuditInput } from '../types'

export async function checkDuplicate(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  data: InvoiceAuditInput,
  excludeInvoiceId?: string
): Promise<AuditCheck> {
  const input: DuplicateCheckInput = {
    dodavatel_ico: data.dodavatel_ico,
    cislo_faktury: data.cislo_faktury,
    variabilni_symbol: data.variabilni_symbol,
    castka_celkem: data.castka_celkem,
  }

  const ico = data.dodavatel_ico?.replace(/\D/g, '')
  const docKey = data.cislo_faktury?.trim() || data.variabilni_symbol?.trim()

  if (!ico || !docKey) {
    return {
      id: 'duplicate',
      label: 'Duplicita',
      message: 'Chybí IČO, číslo faktury nebo variabilní symbol — nelze plně kontrolovat duplicitu.',
      severity: 'warning',
    }
  }

  if (data.castka_celkem == null) {
    return {
      id: 'duplicate',
      label: 'Duplicita',
      message: 'Chybí celková částka — nelze kontrolovat duplicitu podle částky.',
      severity: 'warning',
    }
  }

  const match = await findDuplicateInvoice(supabase, userId, workspaceId, input, excludeInvoiceId)

  if (!match) {
    return {
      id: 'duplicate',
      label: 'Duplicita',
      message: 'Shoda IČO + číslo/VS + částka — duplicita nenalezena.',
      severity: 'ok',
    }
  }

  const severity = match.status === 'sent_to_accounting' ? 'critical' : 'warning'

  return {
    id: 'duplicate',
    label: 'Duplicita',
    message: formatDuplicateMessage(match),
    severity,
    relatedInvoiceId: match.id,
  }
}
