import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getAccountingSystemPrompt, type CountryCode } from './accounting-codes'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
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
  iban: z.string().nullable(),
  ucetni_kod: z.string(),
  ucetni_kod_nazev: z.string(),
  ucetni_kod_duvod: z.string(),
  ucetni_kod_confidence: z.number(),
  confidence: z.number(),
  problemy: z.array(z.string()),
  typ_dokladu: z.enum(['faktura', 'dobropis', 'proforma', 'jiny']).optional().default('faktura'),
  je_prenesena_dan: z.boolean().optional().default(false),
})

export type ExtractedInvoiceData = z.infer<typeof ExtractedInvoiceSchema>

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_invoice',
  description: 'Extrahovaná data z přijaté faktury včetně návrhu účetního kódu',
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
      iban: { type: ['string', 'null'] as unknown as 'string' },
      ucetni_kod: { type: 'string' },
      ucetni_kod_nazev: { type: 'string' },
      ucetni_kod_duvod: { type: 'string' },
      ucetni_kod_confidence: { type: 'number' },
      confidence: { type: 'number' },
      problemy: { type: 'array', items: { type: 'string' } },
      typ_dokladu: { type: 'string', enum: ['faktura', 'dobropis', 'proforma', 'jiny'] },
      je_prenesena_dan: { type: 'boolean' },
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
      'ucetni_kod',
      'ucetni_kod_nazev',
      'ucetni_kod_duvod',
      'ucetni_kod_confidence',
      'confidence',
      'problemy',
    ],
  },
}

function parseFromToolResponse(response: Anthropic.Message): ExtractedInvoiceData {
  const toolBlock = response.content.find((b) => b.type === 'tool_use')
  if (toolBlock && toolBlock.type === 'tool_use') {
    return ExtractedInvoiceSchema.parse(toolBlock.input)
  }

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return ExtractedInvoiceSchema.parse(JSON.parse(cleaned))
}

export async function extractInvoiceFromPdf(
  pdfBase64: string,
  country: CountryCode = 'cz'
): Promise<ExtractedInvoiceData> {
  const systemPrompt = getAccountingSystemPrompt(country)
  const userPrompt =
    country === 'sk'
      ? 'Extrahuj dáta z tejto prijatej faktúry a navrhni účtovný kód. Použi nástroj extract_invoice.'
      : 'Extrahuj data z této přijaté faktury a navrhni účetní kód. Použij nástroj extract_invoice.'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'extract_invoice' },
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
          { type: 'text', text: userPrompt },
        ],
      },
    ],
  })

  return parseFromToolResponse(response)
}
