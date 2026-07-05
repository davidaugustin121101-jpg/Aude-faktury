import type { AuditCheck, InvoiceAuditInput } from '../types'

export function normalizeIco(ico: string | null | undefined): string | null {
  if (!ico) return null
  const digits = ico.replace(/\D/g, '')
  if (digits.length === 0) return null
  return digits.padStart(8, '0').slice(-8)
}

export function checkIcoFormat(data: InvoiceAuditInput, country: 'cz' | 'sk'): AuditCheck {
  const ico = normalizeIco(data.dodavatel_ico)

  if (!ico) {
    return {
      id: 'ico',
      label: country === 'sk' ? 'IČO dodávateľa' : 'IČO dodavatele',
      message: 'IČO chybí nebo není rozpoznáno.',
      severity: 'warning',
    }
  }

  if (ico.length !== 8) {
    return {
      id: 'ico',
      label: country === 'sk' ? 'IČO dodávateľa' : 'IČO dodavatele',
      message: `IČO "${data.dodavatel_ico}" nemá 8 číslic.`,
      severity: 'critical',
    }
  }

  if (country === 'cz' && data.dodavatel_dic && !/^CZ/i.test(data.dodavatel_dic)) {
    return {
      id: 'ico',
      label: 'DIČ dodavatele',
      message: `DIČ "${data.dodavatel_dic}" nemá prefix CZ — zkontrolujte formát.`,
      severity: 'warning',
    }
  }

  if (country === 'sk' && data.dodavatel_dic && !/^SK/i.test(data.dodavatel_dic)) {
    return {
      id: 'ico',
      label: 'IČ DPH dodávateľa',
      message: `IČ DPH "${data.dodavatel_dic}" nemá prefix SK.`,
      severity: 'warning',
    }
  }

  return {
    id: 'ico',
    label: country === 'sk' ? 'IČO dodávateľa' : 'IČO dodavatele',
    message: `IČO ${ico} má platný formát.`,
    severity: 'ok',
  }
}
