import type { CountryCode } from './accounting-codes'
import type { ExtractedInvoiceData } from './claude'

export type PredkontaceSide = 'md' | 'dal'

export type PredkontaceLine = {
  account: string
  label: string
  side: PredkontaceSide
  amount: number
}

export type PredkontaceConfig = {
  country?: CountryCode
  /** Účet DPH (výchozí 343 pro CZ/SK) */
  dphAccount?: string
  /** Účet dodavatelů (výchozí 321) */
  supplierAccount?: string
}

export type Predkontace = {
  naklad: string
  dph: string | null
  dodavatel: string
  lines: PredkontaceLine[]
  /** Např. "504 / 343 / 321" */
  display: string
  /** Např. "MD 504 160,00 · MD 343 33,60 · Dal 321 193,60" */
  displayWithAmounts: string
  /** Text pro poznámku v cílových systémech */
  comment: string
}

const DEFAULT_ACCOUNTS: Record<CountryCode, { dph: string; supplier: string }> = {
  cz: { dph: '343', supplier: '321' },
  sk: { dph: '343', supplier: '321' },
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function formatAmount(amount: number, mena: string): string {
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: mena || 'CZK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${mena || 'CZK'}`
  }
}

export type PredkontaceInput = {
  ucetni_kod: string | null | undefined
  castka_bez_dph?: number | null
  castka_dph?: number | null
  castka_celkem?: number | null
  mena?: string | null
  je_prenesena_dan?: boolean | null
  country?: CountryCode
}

export function buildPredkontace(
  input: PredkontaceInput,
  config: PredkontaceConfig = {}
): Predkontace | null {
  const naklad = (input.ucetni_kod ?? '').trim()
  if (!naklad) return null

  const country = config.country ?? input.country ?? 'cz'
  const defaults = DEFAULT_ACCOUNTS[country]
  const dphAccount = config.dphAccount ?? defaults.dph
  const supplierAccount = config.supplierAccount ?? defaults.supplier
  const mena = (input.mena ?? (country === 'sk' ? 'EUR' : 'CZK')).toUpperCase()

  const base = round2(Number(input.castka_bez_dph ?? 0))
  const vat = round2(Number(input.castka_dph ?? 0))
  const total = round2(
    Number(input.castka_celkem ?? 0) || (base > 0 || vat > 0 ? base + vat : 0)
  )

  const includeVat =
    !input.je_prenesena_dan && vat > 0.009 && (input.castka_dph ?? 0) > 0

  const lines: PredkontaceLine[] = [
    {
      account: naklad,
      label: 'Náklad',
      side: 'md',
      amount: base > 0 ? base : total,
    },
  ]

  if (includeVat) {
    lines.push({
      account: dphAccount,
      label: 'DPH',
      side: 'md',
      amount: vat,
    })
  }

  lines.push({
    account: supplierAccount,
    label: 'Dodavatel',
    side: 'dal',
    amount: total > 0 ? total : base + vat,
  })

  const accountParts = includeVat
    ? [naklad, dphAccount, supplierAccount]
    : [naklad, supplierAccount]

  const display = accountParts.join(' / ')

  const amountParts = lines.map((line) => {
    const sideLabel = line.side === 'md' ? 'MD' : 'Dal'
    return `${sideLabel} ${line.account} ${formatAmount(line.amount, mena)}`
  })

  const displayWithAmounts = amountParts.join(' · ')
  const comment = `Předkontace: ${display} (${displayWithAmounts})`

  return {
    naklad,
    dph: includeVat ? dphAccount : null,
    dodavatel: supplierAccount,
    lines,
    display,
    displayWithAmounts,
    comment,
  }
}

export function buildPredkontaceFromExtracted(
  data: ExtractedInvoiceData,
  config?: PredkontaceConfig
): Predkontace | null {
  const raw = data as ExtractedInvoiceData & { country?: CountryCode }
  return buildPredkontace(
    {
      ucetni_kod: data.ucetni_kod,
      castka_bez_dph: data.castka_bez_dph,
      castka_dph: data.castka_dph,
      castka_celkem: data.castka_celkem,
      mena: data.mena,
      je_prenesena_dan: data.je_prenesena_dan,
      country: raw.country,
    },
    config
  )
}

export function predkontaceFromInvoice(
  invoice: {
    ucetni_kod?: string | null
    castka_bez_dph?: number | null
    castka_dph?: number | null
    castka_celkem?: number | null
    mena?: string | null
    raw_extraction?: unknown
  },
  config?: PredkontaceConfig
): Predkontace | null {
  const raw = (invoice.raw_extraction ?? {}) as {
    je_prenesena_dan?: boolean
    country?: CountryCode
  }
  return buildPredkontace(
    {
      ucetni_kod: invoice.ucetni_kod,
      castka_bez_dph: invoice.castka_bez_dph,
      castka_dph: invoice.castka_dph,
      castka_celkem: invoice.castka_celkem,
      mena: invoice.mena,
      je_prenesena_dan: raw.je_prenesena_dan,
      country: raw.country,
    },
    config
  )
}
