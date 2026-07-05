import type { ExtractedInvoiceData } from './claude'
import { FAKTUROID_USER_AGENT, getFakturoidAccessToken, type FakturoidConnectionRow, connectFakturoidWithClientCredentials, tokenExpiresAt } from './fakturoid-auth'

const FAKTUROID_BASE = 'https://app.fakturoid.cz/api/v3'

type FakturoidErrorBody = {
  error?: string
  error_description?: string
}

export function formatFakturoidApiError(status: number, body: string): string {
  try {
    const json = JSON.parse(body) as FakturoidErrorBody
    if (json.error === 'upgrade_required') {
      return (
        'Váš tarif Fakturoid neumožňuje vytváření nákladů přes API. ' +
        'Potřebujete placený tarif Fakturoid s plným API přístupem (zdarma tarif API nepodporuje). ' +
        'Upgrade: Fakturoid → Nastavení → Tarif, nebo použijte iDoklad / SuperFaktura.'
      )
    }
    if (json.error_description) return json.error_description
    if (json.error) return json.error
  } catch {
    // raw text fallback
  }
  return body || `HTTP ${status}`
}

/** Ověří, že účet umí vytvářet náklady přes API (ne jen číst). */
export async function validateFakturoidExpenseWrite(
  token: string,
  accountSlug: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch(`${FAKTUROID_BASE}/accounts/${accountSlug}/expenses.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': FAKTUROID_USER_AGENT,
      Accept: 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (res.status === 422) return { ok: true }

  if (res.status === 403) {
    const text = await res.text()
    return { ok: false, message: formatFakturoidApiError(403, text) }
  }

  if (res.ok) return { ok: true }

  const text = await res.text()
  return { ok: false, message: formatFakturoidApiError(res.status, text) }
}

export async function sendToFakturoid(
  connection: FakturoidConnectionRow,
  data: ExtractedInvoiceData
): Promise<{ id: string; number: string }> {
  const { token, slug } = await getFakturoidAccessToken(connection)

  const payload = {
    original_number: data.cislo_faktury || undefined,
    issued_on: data.datum_vystaveni,
    due_on: data.datum_splatnosti,
    variable_symbol: data.variabilni_symbol || undefined,
    document_type: 'invoice',
    note: data.popis_plneni || undefined,
    currency: data.mena || 'CZK',
    supplier_name: data.dodavatel_nazev,
    supplier_registration_no: data.dodavatel_ico || undefined,
    ...(data.dodavatel_dic ? { supplier_vat_no: data.dodavatel_dic } : {}),
    ...(data.iban ? { iban: data.iban } : {}),
    lines: [
      {
        name: (data.popis_plneni ?? `Faktura ${data.cislo_faktury}`).slice(0, 200),
        quantity: '1.0',
        unit_name: 'ks',
        unit_price: String(data.castka_bez_dph ?? data.castka_celkem ?? 0),
        vat_rate: String(data.sazba_dph ?? 21),
      },
    ],
    tags: [data.ucetni_kod ?? '518'],
  }

  const res = await fetch(`${FAKTUROID_BASE}/accounts/${slug}/expenses.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': FAKTUROID_USER_AGENT,
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(formatFakturoidApiError(res.status, err))
  }

  const result = (await res.json()) as { id: number; number: string }
  return { id: String(result.id), number: result.number }
}

export async function validateFakturoidToken(
  token: string,
  accountSlug: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${FAKTUROID_BASE}/accounts/${accountSlug}/expenses.json?page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': FAKTUROID_USER_AGENT,
          Accept: 'application/json',
        },
      }
    )
    return res.ok
  } catch {
    return false
  }
}

export async function validateFakturoidClientCredentials(
  clientId: string,
  clientSecret: string
): Promise<{ ok: true; slug: string; token: string; expiresAt: string } | { ok: false; message?: string }> {
  try {
    const result = await connectFakturoidWithClientCredentials(clientId, clientSecret)
    const writeCheck = await validateFakturoidExpenseWrite(
      result.access_token,
      result.account.slug
    )
    if (!writeCheck.ok) {
      return { ok: false, message: writeCheck.message }
    }
    return {
      ok: true,
      slug: result.account.slug,
      token: result.access_token,
      expiresAt: tokenExpiresAt(result.expires_in),
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Neplatné Fakturoid API klíče',
    }
  }
}
