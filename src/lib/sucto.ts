import type { ExtractedInvoiceData } from './claude'
import { buildPredkontaceFromExtracted } from './predkontace'
import {
  buildInvoiceOutputLines,
  buildInvoicePayment,
  formatPaymentAccount,
  roundInvoiceAmount,
} from './invoice-output'

const SUCTO_API = 'https://moje.sucto.cz/api'

export interface SuctoConnection {
  email: string
  password: string
  companyId: string
}

type SuctoInit = {
  account?: { id?: number; country_id?: number | null }
  currency?: { id?: number; iso_code?: string }
  actuarial_number?: string | null
}

type SuctoVat = { id: number; value: string }
type SuctoPartner = { id: number; name?: string; ic?: string | null }
type SuctoActuarialType = { id: number; name: string }

async function suctoRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${SUCTO_API}/${path.replace(/^\//, '')}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Auth-Token': token,
      ...(init?.headers ?? {}),
    },
  })

  const raw = await res.text()
  if (!res.ok) {
    throw new Error(`Súčto API ${res.status}: ${raw.slice(0, 300) || 'chyba'}`)
  }

  if (!raw) return {} as T
  return JSON.parse(raw) as T
}

export async function suctoLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUCTO_API}/sessions/create`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ email, password }),
  })

  const raw = await res.text()
  if (!res.ok) {
    throw new Error(`Súčto přihlášení selhalo (${res.status})`)
  }

  const json = JSON.parse(raw) as { authentication_token?: string }
  if (!json.authentication_token) {
    throw new Error('Súčto nevrátilo autentizační token')
  }
  return json.authentication_token
}

export function pickVatId(vats: SuctoVat[], sazbaDph: number | null | undefined): number | null {
  if (vats.length === 0) return null
  const target = sazbaDph ?? 21
  const match = vats.find((v) => Math.abs(parseFloat(v.value) - target) < 0.01)
  return match?.id ?? vats[0]?.id ?? null
}

export function buildSuctoActuarialPayload(params: {
  data: ExtractedInvoiceData
  init: SuctoInit
  partnerId: number
  actuarialTypeId: number
  vatIdByRate: Map<number, number>
  fallbackVatId: number | null
}): Record<string, unknown> {
  const { data, init, partnerId, actuarialTypeId, vatIdByRate, fallbackVatId } = params
  const predkontace = buildPredkontaceFromExtracted(data)
  const internalNotice = predkontace
    ? predkontace.comment
    : `Účetní kód: ${data.ucetni_kod} – ${data.ucetni_kod_nazev}`

  const payment = buildInvoicePayment(data)
  const paymentAccount = formatPaymentAccount(payment)
  const outputLines = buildInvoiceOutputLines(data)

  const lines = outputLines.map((line) => {
    const tax = roundInvoiceAmount((line.castkaBezDph * line.sazbaDph) / 100)
    const total = roundInvoiceAmount(line.castkaBezDph + tax)
    const vatId = vatIdByRate.get(line.sazbaDph) ?? fallbackVatId

    const row: Record<string, unknown> = {
      lineable_type: 'Actuarial',
      name: line.nazev.slice(0, 255),
      quantity: line.mnozstvi,
      unit_price: line.jednotkovaCena,
      base_price: line.castkaBezDph,
      tax,
      total_price: total,
      unit_name: line.jednotka,
    }
    if (vatId != null) row.vat_id = vatId
    return row
  })

  return {
    partner_id: partnerId,
    actuarial_type_id: actuarialTypeId,
    account_id: init.account?.id,
    currency_id: init.currency?.id,
    actuarial_number: init.actuarial_number ?? data.cislo_faktury ?? `AF-${Date.now()}`,
    issue_date_at: data.datum_vystaveni,
    due_date_at: data.datum_splatnosti,
    uzp_date_at: data.datum_duzp ?? data.datum_vystaveni,
    external_number: data.cislo_faktury || undefined,
    variable_symbol: data.variabilni_symbol || undefined,
    order_number: data.cislo_objednavky || undefined,
    iban: payment.iban ?? undefined,
    bank_number: paymentAccount && !payment.iban ? paymentAccount : undefined,
    swift: payment.swift ?? undefined,
    internal_notice: internalNotice,
    lines,
  }
}

export function buildVatIdByRate(vats: SuctoVat[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const vat of vats) {
    const rate = Math.round(parseFloat(vat.value))
    if (Number.isFinite(rate)) map.set(rate, vat.id)
  }
  return map
}

async function resolvePartnerId(
  token: string,
  companyId: string,
  data: ExtractedInvoiceData
): Promise<number> {
  const ico = data.dodavatel_ico?.replace(/\D/g, '')
  if (ico && ico.length >= 8) {
    try {
      const partner = await suctoRequest<SuctoPartner>(
        `companies/${companyId}/partners/create_by_ares/${ico}`,
        token,
        { method: 'POST', body: '{}' }
      )
      if (partner.id) return partner.id
    } catch {
      // fallback to search
    }
  }

  const q = encodeURIComponent(data.dodavatel_ico || data.dodavatel_nazev)
  const partners = await suctoRequest<SuctoPartner[]>(
    `companies/${companyId}/partners?q[name_or_ic_or_dic_or_address_street_or_address_city_cont]=${q}&limit=5`,
    token
  )
  const match = partners.find(
    (p) => p.ic && ico && p.ic.replace(/\D/g, '') === ico
  )
  if (match?.id) return match.id
  if (partners[0]?.id) return partners[0].id

  throw new Error(
    'Dodavatele se nepodařilo najít ve Súčtu. Založte partnera ručně nebo ověřte IČO.'
  )
}

async function resolveActuarialTypeId(token: string): Promise<number> {
  const types = await suctoRequest<SuctoActuarialType[]>('actuarial_types', token)
  const invoiceType =
    types.find((t) => t.name === 'invoice') ??
    types.find((t) => /invoice|faktura/i.test(t.name)) ??
    types[0]
  if (!invoiceType?.id) throw new Error('Súčto: nelze určit typ přijatého dokladu')
  return invoiceType.id
}

export async function validateSuctoConnection(connection: SuctoConnection): Promise<boolean> {
  try {
    const token = await suctoLogin(connection.email, connection.password)
    await suctoRequest<SuctoInit>(
      `companies/${connection.companyId}/actuarials_ins/new`,
      token
    )
    return true
  } catch {
    return false
  }
}

export async function sendToSucto(
  connection: SuctoConnection,
  data: ExtractedInvoiceData
): Promise<{ id: string; number: string }> {
  const token = await suctoLogin(connection.email, connection.password)
  const companyId = connection.companyId

  const [init, actuarialTypeId, partnerId] = await Promise.all([
    suctoRequest<SuctoInit>(`companies/${companyId}/actuarials_ins/new`, token),
    resolveActuarialTypeId(token),
    resolvePartnerId(token, companyId, data),
  ])

  const countryId = init.account?.country_id
  let vatIdByRate = new Map<number, number>()
  let fallbackVatId: number | null = null
  if (countryId) {
    const vats = await suctoRequest<SuctoVat[]>(
      `countries/${countryId}/vats/current`,
      token
    )
    vatIdByRate = buildVatIdByRate(vats)
    fallbackVatId = pickVatId(vats, data.sazba_dph)
  }

  const payload = buildSuctoActuarialPayload({
    data,
    init,
    partnerId,
    actuarialTypeId,
    vatIdByRate,
    fallbackVatId,
  })

  const created = await suctoRequest<{ id?: number; actuarial_number?: string }>(
    `companies/${companyId}/actuarials_ins`,
    token,
    { method: 'POST', body: JSON.stringify(payload) }
  )

  if (!created.id) throw new Error('Súčto nevrátilo ID dokladu')

  return {
    id: String(created.id),
    number: created.actuarial_number ?? data.cislo_faktury ?? String(created.id),
  }
}
