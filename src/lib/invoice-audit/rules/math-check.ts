import type { AuditCheck, InvoiceAuditInput } from '../types'

const TOLERANCE = 1.0

export function checkMath(data: InvoiceAuditInput): AuditCheck {
  const base = data.castka_bez_dph
  const vat = data.castka_dph
  const total = data.castka_celkem

  if (base == null || total == null) {
    return {
      id: 'math',
      label: 'Součty DPH',
      message: 'Chybí částka bez DPH nebo celková částka — nelze ověřit součet.',
      severity: 'warning',
    }
  }

  const expectedTotal = base + (vat ?? 0)
  const diff = Math.abs(expectedTotal - total)

  if (diff <= TOLERANCE) {
    return {
      id: 'math',
      label: 'Součty DPH',
      message: `Základ ${base.toFixed(2)} + DPH ${(vat ?? 0).toFixed(2)} = celkem ${total.toFixed(2)} ✓`,
      severity: 'ok',
    }
  }

  if (data.sazba_dph && data.sazba_dph > 0 && vat != null) {
    const expectedVat = Math.round(base * (data.sazba_dph / 100) * 100) / 100
    const vatDiff = Math.abs(expectedVat - vat)
    if (vatDiff > TOLERANCE) {
      return {
        id: 'math',
        label: 'Součty DPH',
        message: `Nesedí DPH: očekáváno ${expectedVat.toFixed(2)} (${data.sazba_dph} % ze ${base.toFixed(2)}), na faktuře ${vat.toFixed(2)}.`,
        severity: 'critical',
      }
    }
  }

  return {
    id: 'math',
    label: 'Součty DPH',
    message: `Nesedí celková částka: základ + DPH = ${expectedTotal.toFixed(2)}, na faktuře ${total.toFixed(2)} (rozdíl ${diff.toFixed(2)}).`,
    severity: 'critical',
  }
}
