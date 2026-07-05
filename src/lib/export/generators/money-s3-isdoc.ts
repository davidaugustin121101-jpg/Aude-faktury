import type { NormalizedInvoice } from '../types'
import { generateIsdoc } from './isdoc'
import { safeFilenamePart } from '../xml-utils'

/** Money S3 umí importovat ISDOC — stejný obsah, jiný název souboru */
export function generateMoneyIsdoc(inv: NormalizedInvoice): string {
  return generateIsdoc(inv)
}

export function moneyIsdocFilename(inv: NormalizedInvoice): string {
  return `money-${safeFilenamePart(inv.cisloFaktury)}.isdoc`
}
