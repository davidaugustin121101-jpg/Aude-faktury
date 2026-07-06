import type { AuditCheck, InvoiceAuditInput } from '../types'

const CZ_DHM_THRESHOLD = 80_000
const CZ_NMA_THRESHOLD = 60_000

export function checkAssetThreshold(data: InvoiceAuditInput): AuditCheck {
  const amount = data.castka_bez_dph ?? data.castka_celkem
  const code = data.ucetni_kod ?? ''

  if (amount == null) {
    return {
      id: 'asset',
      label: 'Majetkový práh',
      message: 'Nelze posoudit majetkový práh — chybí částka.',
      severity: 'warning',
    }
  }

  if (amount >= CZ_DHM_THRESHOLD * 0.9 && amount < CZ_DHM_THRESHOLD && code !== '022') {
    return {
      id: 'asset',
      label: 'Majetkový práh',
      message: `Částka ${amount.toLocaleString('cs-CZ')} Kč je blízko prahu DHM (80 000 Kč) — zvažte účet 022 místo ${code}.`,
      severity: 'warning',
    }
  }
  if (amount >= CZ_DHM_THRESHOLD && code !== '022' && code !== '013') {
    return {
      id: 'asset',
      label: 'Majetkový práh',
      message: `Částka nad 80 000 Kč — DHM by měl být účet 022, navržen ${code}.`,
      severity: 'warning',
    }
  }
  if (amount >= CZ_NMA_THRESHOLD && code === '518') {
    return {
      id: 'asset',
      label: 'Majetkový práh',
      message: `Jednorázový nákup nad 60 000 Kč — zvažte účet 013 (nehmotný majetek) místo 518.`,
      severity: 'warning',
    }
  }

  return {
    id: 'asset',
    label: 'Majetkový práh',
    message: `Účet ${code} odpovídá částce ${amount.toLocaleString('cs-CZ')} Kč.`,
    severity: 'ok',
  }
}
