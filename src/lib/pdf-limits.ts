/** Maximální velikost PDF před odesláním do extrakce (5 MB). */
export const PDF_MAX_BYTES = 5 * 1024 * 1024

/** Maximální počet stran PDF posílaných do modelu. */
export const PDF_MAX_PAGES = 3

/** Maximální výstupní tokeny na jednu extrakci. */
export const EXTRACTION_MAX_TOKENS = 2048

/** Minimální délka extrahovaného textu pro text-first cestu. */
export const PDF_MIN_TEXT_CHARS = 120

/** Maximální délka textu posílaného do modelu (ochrana před obřími PDF). */
export const PDF_MAX_TEXT_CHARS = 24_000
