import type { ExportProfile, NormalizedInvoice } from '../types'
import { generatePohodaXml } from './pohoda-xml'

/**
 * Helios iNuvio často importuje Pohoda-kompatibilní XML.
 * Generujeme stejnou Stormware strukturu s poznámkou pro iNuvio.
 */
export function generateHeliosInuvioXml(inv: NormalizedInvoice, profile?: ExportProfile): string {
  const xml = generatePohodaXml(inv, profile)
  return xml.replace(
    'note="Export faktury"',
    'note="Export faktury — Helios iNuvio import"'
  )
}
