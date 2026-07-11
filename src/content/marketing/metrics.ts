/**
 * TODO_NEED_REAL_METRIC: doplnit naměřenou mediánovou dobu vytěžení (sekundy) z produkční telemetrie.
 */
export const EXTRACTION_MEDIAN_SECONDS: number | null = null

/**
 * TODO_NEED_REAL_METRIC: doplnit naměřenou přesnost vytěžení polí faktury (%).
 */
export const EXTRACTION_ACCURACY_PERCENT: number | null = null

/** Text pro hero / funkce — zobrazí měřitelné tvrzení jen pokud máme reálná data. */
export function getExtractionSpeedClaim(): string {
  if (EXTRACTION_MEDIAN_SECONDS != null) {
    return `Vytěžení faktury za ${EXTRACTION_MEDIAN_SECONDS} vteřin`
  }
  if (EXTRACTION_ACCURACY_PERCENT != null) {
    return `Přesnost vytěžení ${EXTRACTION_ACCURACY_PERCENT} %`
  }
  // TODO_NEED_REAL_METRIC: nahradit kvalitativním tvrzením reálným číslem
  return 'Vytěžení běží na pozadí — výsledek za pár vteřin'
}
