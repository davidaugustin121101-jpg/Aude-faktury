import Anthropic from '@anthropic-ai/sdk'

const CLAUDE_SYSTEM_PROMPT = `
Jsi expert na české účetnictví a daňové předpisy platné v roce 2026.
Zpracováváš PŘIJATÉ faktury od dodavatelů – tedy náklady firmy, ne výnosy.
Z přiložené faktury extrahuj data a navrhni účetní kód.
Vrať POUZE validní JSON. Žádný text před ani po JSON. Žádné backticks.

{
  "dodavatel_nazev": string nebo null,
  "dodavatel_ico": string (přesně 8 číslic) nebo null,
  "dodavatel_dic": string (formát CZ + čísla) nebo null,
  "cislo_faktury": string nebo null,
  "datum_vystaveni": "YYYY-MM-DD" nebo null,
  "datum_splatnosti": "YYYY-MM-DD" nebo null,
  "variabilni_symbol": string (jen číslice) nebo null,
  "castka_bez_dph": number (Kč) nebo null,
  "sazba_dph": 0, 12, nebo 21 nebo null,
  "castka_dph": number (Kč) nebo null,
  "castka_celkem": number (Kč) nebo null,
  "mena": "CZK" nebo jiná měna,
  "popis_plneni": string max 200 znaků nebo null,
  "iban": string nebo null,
  "ucetni_kod": string,
  "ucetni_kod_nazev": string,
  "ucetni_kod_duvod": string,
  "ucetni_kod_confidence": number 0.0-1.0,
  "confidence": number 0.0-1.0,
  "problemy": string[]
}

Přiřaď účetní kód dle české účtové osnovy (hardware >80k → 022, <80k → 501, software >60k → 013, SaaS/reklama/přeprava → 518, energie → 502, zboží e-shop → 504/131, atd.).
`

export interface ExtractedInvoice {
  dodavatel_nazev: string | null
  dodavatel_ico: string | null
  dodavatel_dic: string | null
  cislo_faktury: string | null
  datum_vystaveni: string | null
  datum_splatnosti: string | null
  variabilni_symbol: string | null
  castka_bez_dph: number | null
  sazba_dph: number | null
  castka_dph: number | null
  castka_celkem: number | null
  mena: string
  popis_plneni: string | null
  iban: string | null
  ucetni_kod: string
  ucetni_kod_nazev: string
  ucetni_kod_duvod: string
  ucetni_kod_confidence: number
  confidence: number
  problemy: string[]
}

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY není nastaven')
  return new Anthropic({ apiKey: key })
}

export async function extractInvoiceFromPdf(
  pdfBase64: string
): Promise<ExtractedInvoice> {
  const anthropic = getAnthropic()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: 'Extrahuj data z této přijaté faktury a navrhni účetní kód.',
          },
        ],
      },
    ],
  })

  const rawText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const cleaned = rawText.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(cleaned) as ExtractedInvoice
  } catch {
    throw new Error(
      `Claude vrátil neplatný JSON. Začátek odpovědi: ${cleaned.slice(0, 300)}`
    )
  }
}
