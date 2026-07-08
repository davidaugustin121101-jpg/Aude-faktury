import type { SupabaseClient } from '@supabase/supabase-js'
import {
  findAdvancePairing,
  formatAdvancePairMessage,
  type AdvancePairCheckInput,
} from '@/lib/advance-pairing'
import { isZalohovaTyp } from '@/lib/invoice-amounts'
import type { AuditCheck, InvoiceAuditInput } from '../types'

export async function checkAdvancePairing(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  data: InvoiceAuditInput,
  excludeInvoiceId?: string
): Promise<AuditCheck> {
  const input: AdvancePairCheckInput = {
    dodavatel_ico: data.dodavatel_ico,
    typ_faktury: data.typ_faktury,
    typ_dokladu: data.typ_dokladu,
    castka_celkem: data.castka_celkem,
    castka_k_uhrade: data.castka_k_uhrade,
    castka_bez_dph: data.castka_bez_dph,
    castka_dph: data.castka_dph,
    polozky: data.polozky,
  }

  const ico = data.dodavatel_ico?.replace(/\D/g, '')
  if (!ico) {
    return {
      id: 'advance_pairing',
      label: 'Záloha / daňový doklad',
      message: 'Chybí IČO dodavatele — nelze hledat navazující zálohu.',
      severity: 'warning',
    }
  }

  const match = await findAdvancePairing(
    supabase,
    userId,
    workspaceId,
    input,
    excludeInvoiceId
  )

  if (!match) {
    return {
      id: 'advance_pairing',
      label: 'Záloha / daňový doklad',
      message: 'Navazující zálohová faktura nebo finální daňový doklad nenalezen.',
      severity: 'ok',
    }
  }

  return {
    id: 'advance_pairing',
    label: 'Záloha / daňový doklad',
    message: formatAdvancePairMessage(match, isZalohovaTyp(data)),
    severity: 'warning',
    relatedInvoiceId: match.id,
  }
}
