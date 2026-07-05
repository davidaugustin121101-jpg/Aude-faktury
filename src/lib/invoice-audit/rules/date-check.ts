import type { AuditCheck, InvoiceAuditInput } from '../types'

export function checkDates(data: InvoiceAuditInput): AuditCheck {
  const issued = data.datum_vystaveni
  const due = data.datum_splatnosti

  if (!issued) {
    return {
      id: 'dates',
      label: 'Data faktury',
      message: 'Chybí datum vystavení.',
      severity: 'warning',
    }
  }

  if (!due) {
    return {
      id: 'dates',
      label: 'Data faktury',
      message: `Datum vystavení ${issued} ✓ · chybí datum splatnosti.`,
      severity: 'warning',
    }
  }

  const issuedDate = new Date(issued)
  const dueDate = new Date(due)

  if (dueDate < issuedDate) {
    return {
      id: 'dates',
      label: 'Data faktury',
      message: `Datum splatnosti (${due}) je před datem vystavení (${issued}).`,
      severity: 'critical',
    }
  }

  return {
    id: 'dates',
    label: 'Data faktury',
    message: `Vystaveno ${issued}, splatnost ${due} ✓`,
    severity: 'ok',
  }
}
