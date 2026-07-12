import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getAccountingSystemPrompt } from './accounting-codes'
import { EXTRACTION_MAX_TOKENS } from './pdf-limits'
import type { PreparedPdfForExtraction } from './pdf-preprocess'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const EXTRACTION_MODEL_FAST = 'claude-haiku-4-5'
export const EXTRACTION_MODEL_QUALITY = 'claude-sonnet-4-6'

const HAIKU_CONFIDENCE_RETRY_THRESHOLD = 0.72

const PolozkaSchema = z.object({
  nazev: z.string(),
  mnozstvi: z.number(),
  jednotkova_cena: z.number(),
  sazba_dph: z.number(),
  typ: z.enum(['zbozi', 'sluzba']),
  jednotka: z.string().optional(),
})

export const ExtractedInvoiceSchema = z.object({
  dodavatel_nazev: z.string(),
  dodavatel_ico: z.string(),
  dodavatel_dic: z.string().nullable(),
  cislo_faktury: z.string(),
  datum_vystaveni: z.string(),
  datum_splatnosti: z.string(),
  variabilni_symbol: z.string(),
  castka_bez_dph: z.number(),
  sazba_dph: z.number(),
  castka_dph: z.number(),
  castka_celkem: z.number(),
  mena: z.string(),
  popis_plneni: z.string(),
  cislo_uctu: z.string().nullable().optional(),
  kod_banky: z.string().nullable().optional(),
  iban: z.string().nullable(),
  swift: z.string().nullable().optional(),
  konstantni_symbol: z.string().nullable().optional(),
  cislo_objednavky: z.string().nullable().optional(),
  ucetni_kod: z.string().optional(),
  ucetni_kod_nazev: z.string().optional(),
  ucetni_kod_duvod: z.string().optional(),
  ucetni_kod_confidence: z.number().optional(),
  confidence: z.number(),
  problemy: z.array(z.string()),
  typ_dokladu: z.enum(['faktura', 'dobropis', 'proforma', 'jiny']).optional().default('faktura'),
  typ_faktury: z.enum(['zalohova', 'danovy_doklad']).optional().default('danovy_doklad'),
  castka_k_uhrade: z.number().optional(),
  datum_duzp: z.string().nullable().optional(),
  je_prenesena_dan: z.boolean().optional().default(false),
  polozky: z.array(PolozkaSchema).optional().default([]),
})

export type FakturaPolozka = z.infer<typeof PolozkaSchema> & {
  ucetni_kod?: string
  ucetni_kod_nazev?: string
}

export type ExtractedInvoiceData = z.infer<typeof ExtractedInvoiceSchema>

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_invoice',
  description: 'Extrahovaná data z přijaté faktury',
  input_schema: {
    type: 'object' as const,
    properties: {
      dodavatel_nazev: { type: 'string' },
      dodavatel_ico: { type: 'string' },
      dodavatel_dic: { type: ['string', 'null'] as unknown as 'string' },
      cislo_faktury: { type: 'string' },
      datum_vystaveni: { type: 'string' },
      datum_splatnosti: { type: 'string' },
      variabilni_symbol: { type: 'string' },
      castka_bez_dph: { type: 'number' },
      sazba_dph: { type: 'number' },
      castka_dph: { type: 'number' },
      castka_celkem: { type: 'number' },
      mena: { type: 'string' },
      popis_plneni: { type: 'string' },
      cislo_uctu: {
        type: ['string', 'null'] as unknown as 'string',
        description: 'Číslo účtu dodavatele, např. 1234567891/0321',
      },
      kod_banky: {
        type: ['string', 'null'] as unknown as 'string',
        description: '4místný kód banky, pokud je uveden odděleně',
      },
      iban: { type: ['string', 'null'] as unknown as 'string' },
      swift: { type: ['string', 'null'] as unknown as 'string', description: 'SWIFT/BIC' },
      konstantni_symbol: { type: ['string', 'null'] as unknown as 'string' },
      cislo_objednavky: { type: ['string', 'null'] as unknown as 'string' },
      confidence: { type: 'number' },
      problemy: { type: 'array', items: { type: 'string' } },
      typ_dokladu: { type: 'string', enum: ['faktura', 'dobropis', 'proforma', 'jiny'] },
      typ_faktury: { type: 'string', enum: ['zalohova', 'danovy_doklad'] },
      castka_k_uhrade: { type: 'number', description: 'Zbývá k úhradě po záloze; 0 pokud záloha pokryla vše' },
      datum_duzp: {
        type: ['string', 'null'] as unknown as 'string',
        description: 'Datum uskutečnění zdanitelného plnění YYYY-MM-DD',
      },
      je_prenesena_dan: { type: 'boolean' },
      polozky: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nazev: { type: 'string' },
            mnozstvi: { type: 'number' },
            jednotkova_cena: { type: 'number' },
            sazba_dph: { type: 'number' },
            typ: { type: 'string', enum: ['zbozi', 'sluzba'] },
            jednotka: { type: 'string', description: 'ks, kg, hod, m²…' },
          },
          required: ['nazev', 'mnozstvi', 'jednotkova_cena', 'sazba_dph', 'typ'],
        },
      },
    },
    required: [
      'dodavatel_nazev',
      'dodavatel_ico',
      'cislo_faktury',
      'datum_vystaveni',
      'datum_splatnosti',
      'castka_bez_dph',
      'sazba_dph',
      'castka_dph',
      'castka_celkem',
      'mena',
      'confidence',
      'problemy',
    ],
  },
}

const CACHED_TOOLS: Anthropic.Tool[] = [
  {
    ...EXTRACTION_TOOL,
    cache_control: { type: 'ephemeral' },
  },
]

function parseFromToolResponse(response: Anthropic.Message): ExtractedInvoiceData {
  const toolBlock = response.content.find((b) => b.type === 'tool_use')
  if (toolBlock && toolBlock.type === 'tool_use') {
    return normalizeExtractedInvoice(ExtractedInvoiceSchema.parse(toolBlock.input))
  }

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return normalizeExtractedInvoice(ExtractedInvoiceSchema.parse(JSON.parse(cleaned)))
}

export function normalizeExtractedInvoice(data: ExtractedInvoiceData): ExtractedInvoiceData {
  return {
    ...data,
    variabilni_symbol: data.variabilni_symbol ?? '',
    popis_plneni: data.popis_plneni ?? '',
    problemy: data.problemy ?? [],
    polozky: data.polozky ?? [],
    ucetni_kod: data.ucetni_kod?.trim() || undefined,
    ucetni_kod_nazev: data.ucetni_kod_nazev?.trim() || undefined,
    ucetni_kod_duvod: data.ucetni_kod_duvod?.trim() || undefined,
    ucetni_kod_confidence: data.ucetni_kod_confidence,
  }
}

function buildUserContent(prepared: PreparedPdfForExtraction): Anthropic.MessageCreateParams['messages'][0]['content'] {
  const instruction =
    'Extrahuj data z této přijaté faktury. Vždy vytěž všechny řádky tabulky položek (polozky[]), bankovní údaje (číslo účtu, IBAN, SWIFT) a platební symboly. Použij nástroj extract_invoice.'

  if (prepared.inputMode === 'text' && prepared.text) {
    return [
      {
        type: 'text',
        text: `${instruction}\n\n--- TEXT FAKTURY ---\n${prepared.text}`,
      },
    ]
  }

  return [
    {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: prepared.pdfBase64,
      },
    },
    { type: 'text', text: instruction },
  ]
}

function selectPrimaryModel(prepared: PreparedPdfForExtraction): string {
  if (prepared.inputMode === 'text' && prepared.isSimple) {
    return EXTRACTION_MODEL_FAST
  }
  return EXTRACTION_MODEL_QUALITY
}

async function callExtractionModel(
  model: string,
  prepared: PreparedPdfForExtraction
): Promise<ExtractedInvoiceData> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: EXTRACTION_MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: getAccountingSystemPrompt(),
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: CACHED_TOOLS,
    tool_choice: { type: 'tool', name: 'extract_invoice' },
    messages: [
      {
        role: 'user',
        content: buildUserContent(prepared),
      },
    ],
  })

  return parseFromToolResponse(response)
}

export async function extractInvoiceFromPrepared(
  prepared: PreparedPdfForExtraction
): Promise<ExtractedInvoiceData> {
  const primaryModel = selectPrimaryModel(prepared)
  let extracted = await callExtractionModel(primaryModel, prepared)

  const shouldRetryWithQuality =
    primaryModel === EXTRACTION_MODEL_FAST &&
    (extracted.confidence < HAIKU_CONFIDENCE_RETRY_THRESHOLD ||
      !extracted.dodavatel_ico?.trim() ||
      !extracted.cislo_faktury?.trim())

  if (shouldRetryWithQuality) {
    extracted = await callExtractionModel(EXTRACTION_MODEL_QUALITY, prepared)
  }

  return extracted
}

/** @deprecated Použijte preparePdfForExtraction + extractInvoiceFromPrepared */
export async function extractInvoiceFromPdf(pdfBase64: string): Promise<ExtractedInvoiceData> {
  const buffer = Buffer.from(pdfBase64, 'base64')
  const { preparePdfForExtraction } = await import('./pdf-preprocess')
  const prepared = await preparePdfForExtraction(buffer)
  return extractInvoiceFromPrepared(prepared)
}
