import { getVatRates } from '@/lib/accounting-codes'
import type { AuditCheck, InvoiceAuditInput } from '../types'

export function checkVat(data: InvoiceAuditInput): AuditCheck {
  const rate = data.sazba_dph
  const allowed = getVatRates()

  if (rate == null) {
    return {
      id: 'vat',
      label: 'Sazba DPH',
      message: 'Sazba DPH nebyla rozpoznána.',
      severity: 'warning',
    }
  }

  if (!allowed.includes(rate)) {
    return {
      id: 'vat',
      label: 'Sazba DPH',
      message: `Sazba ${rate} % není standardní pro Česko (${allowed.join(', ')} %).`,
      severity: 'warning',
    }
  }

  if (rate === 0 && (data.castka_dph ?? 0) > 0.01) {
    return {
      id: 'vat',
      label: 'Sazba DPH',
      message: 'Sazba 0 %, ale faktura obsahuje nenulové DPH — zkontrolujte plátce/neplátce.',
      severity: 'critical',
    }
  }

  if (data.je_prenesena_dan) {
    return {
      id: 'vat',
      label: 'Sazba DPH',
      message: `Sazba ${rate} % · faktura má přenesení daňové povinnosti (reverse charge).`,
      severity: 'warning',
    }
  }

  return {
    id: 'vat',
    label: 'Sazba DPH',
    message: `Sazba DPH ${rate} % je platná pro Česko.`,
    severity: 'ok',
  }
}
