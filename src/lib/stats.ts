/** Odhad ušetřeného času na jednu zpracovanou fakturu (minuty). */
export const MINUTES_SAVED_PER_INVOICE = 7

export function estimateSavedHours(invoiceCount: number): number {
  return Math.round(((invoiceCount * MINUTES_SAVED_PER_INVOICE) / 60) * 10) / 10
}
