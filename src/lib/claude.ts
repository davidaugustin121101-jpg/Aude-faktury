import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getAccountingSystemPrompt } from './accounting-codes'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const PolozkaSchema = z.object({
  nazev: z.string(),
  mnozstvi: z.number(),
  jednotkova_cena: z.number(),
  sazba_dph: z.number(),
  typ: z.enum(['zbozi', 'sluzba']),
  jednotka: z.string().optional(),
  ucetni_kod: z.string().optional(),
  ucetni_kod_nazev: z.string().optional(),
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
  ucetni_kod: z.string(),
  ucetni_kod_nazev: z.string(),
  ucetni_kod_duvod: z.string(),
  ucetni_kod_confidence: z.number(),
  confidence: z.number(),
  problemy: z.array(z.string()),
  typ_dokladu: z.enum(['faktura', 'dobropis', 'proforma', 'jiny']).optional().default('faktura'),
  typ_faktury: z.enum(['zalohova', 'danovy_doklad']).optional().default('danovy_doklad'),
  castka_k_uhrade: z.number().optional(),
  datum_duzp: z.string().nullable().optional(),
  je_prenesena_dan: z.boolean().optional().default(false),
  polozky: z.array(PolozkaSchema).optional().default([]),
})

export type FakturaPolozka = z.infer<typeof PolozkaSchema>

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
      ucetni_kod: { type: 'string' },
      ucetni_kod_nazev: { type: 'string' },
      ucetni_kod_duvod: { type: 'string' },
      ucetni_kod_confidence: { type: 'number' },
      confidence: { type: 'number' },
      problemy: { type: 'array', items: { type: 'string' } },
      typ_dokladu: { type: 'string', enum: ['faktura', 'dobropis', 'proforma', 'jiny'] },
      typ_faktury: { type: 'string', enum: ['zalohova', 'danovy_doklad'] },
      castka_k_uhrade: { type: 'number', description: 'Zbývá k úhradě po záloze; 0 pokud záloha pokryla vše' },
      datum_duzp: { type: ['string', 'null'] as unknown as 'string', description: 'Datum uskutečnění zdanitelného plnění YYYY-MM-DD' },
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
            ucetni_kod: { type: 'string' },
            ucetni_kod_nazev: { type: 'string' },
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

export async function extractInvoiceFromPdf(pdfBase64: string): Promise<ExtractedInvoiceData> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: getAccountingSystemPrompt(),
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
          {
            type: 'text',
            text: 'Extrahuj data z této přijaté faktury. Vždy vytěž všechny řádky tabulky položek (polozky[]), bankovní údaje (číslo účtu, IBAN, SWIFT) a platební symboly. Použij nástroj extract_invoice.',
          },
        ],
      },
    ],
  })

  return parseFromToolResponse(response)
}
