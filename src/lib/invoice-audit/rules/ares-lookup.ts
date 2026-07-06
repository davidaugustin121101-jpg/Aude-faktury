import { normalizeIco } from './ico-format-check'
import type { AuditCheck, InvoiceAuditInput } from '../types'

type AresSidlo = {
  kodStatu?: string
  nazevUlice?: string
  cisloDomovni?: number
  cisloOrientacni?: number
  cisloOrientacniPismeno?: string
  nazevObce?: string
  psc?: number
  textovaAdresa?: string
}

export type AresSubject = {
  obchodniJmeno?: string
  ico?: string
  sidlo?: AresSidlo
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+(s\.r\.o\.|sro|a\.s\.|as|spol\. s r\.o\.|v\.o\.s\.|k\.s\.)/gi, '')
    .replace(/[^a-z0-9]/g, '')
}

function namesSimilar(a: string, b: string): boolean {
  const na = normalizeCompanyName(a)
  const nb = normalizeCompanyName(b)
  if (!na || !nb) return false
  return na.includes(nb) || nb.includes(na) || na === nb
}

export async function lookupAres(ico: string): Promise<AresSubject | null> {
  try {
    const res = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 },
      }
    )
    if (!res.ok) return null
    const json = (await res.json()) as AresSubject
    return json
  } catch {
    return null
  }
}

export async function checkAres(
  data: InvoiceAuditInput,
  country: 'cz' | 'sk'
): Promise<AuditCheck> {
  if (country !== 'cz') {
    return {
      id: 'ares',
      label: 'Register firiem',
      message: 'Overenie IČO cez ARES platí len pre CZ dodávateľov.',
      severity: 'ok',
    }
  }

  const ico = normalizeIco(data.dodavatel_ico)
  if (!ico) {
    return {
      id: 'ares',
      label: 'ARES',
      message: 'Bez IČO nelze ověřit v ARES.',
      severity: 'warning',
    }
  }

  const subject = await lookupAres(ico)
  if (!subject?.obchodniJmeno) {
    return {
      id: 'ares',
      label: 'ARES',
      message: `IČO ${ico} nebylo nalezeno v ARES — zkontrolujte správnost.`,
      severity: 'critical',
    }
  }

  const invoiceName = data.dodavatel_nazev ?? ''
  if (invoiceName && !namesSimilar(invoiceName, subject.obchodniJmeno)) {
    return {
      id: 'ares',
      label: 'ARES',
      message: `Název na faktuře („${invoiceName}”) neodpovídá ARES („${subject.obchodniJmeno}”).`,
      severity: 'warning',
    }
  }

  return {
    id: 'ares',
    label: 'ARES',
    message: `IČO ${ico} ověřeno v ARES: ${subject.obchodniJmeno}.`,
    severity: 'ok',
  }
}
