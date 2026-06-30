import {
  refreshFakturoidToken,
  connectFakturoidWithClientCredentials,
  type FakturoidUserAccount,
} from '@/lib/fakturoid-oauth'
import type { AccountingConnectionRow } from '@/lib/accounting-connection'

const FAKTUROID_API = 'https://app.fakturoid.cz/api/v3'
const USER_AGENT = 'Audeflow Faktury (podpora@audeflow.cz)'

interface InvoiceData {
  datum_vystaveni?: string | null
  datum_splatnosti?: string | null
  variabilni_symbol?: string | null
  popis_plneni?: string | null
  ucetni_kod?: string | null
  dodavatel_nazev?: string | null
  dodavatel_ico?: string | null
  dodavatel_dic?: string | null
  castka_bez_dph?: number | null
  castka_celkem?: number | null
  sazba_dph?: number | null
  original_filename?: string | null
}

type TokenUpdate = {
  fakturoid_oauth_token: string
  fakturoid_refresh_token?: string
  fakturoid_token_expires_at: string
}

type FakturoidApiError = {
  error?: string
  error_description?: string
}

function fakturoidHeaders(accessToken: string, json = false) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'User-Agent': USER_AGENT,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  }
}

export function formatFakturoidError(status: number, body: string): string {
  let parsed: FakturoidApiError = {}
  try {
    parsed = JSON.parse(body) as FakturoidApiError
  } catch {
    // raw text
  }

  if (parsed.error === 'upgrade_required') {
    return (
      'Tvůj tarif Fakturoidu neumožňuje automatické vytvoření výdaje přes API. ' +
      'Buď přejdi na placený tarif (Na lehko nebo vyšší), nebo použij iDoklad. ' +
      'Pokud máš uložené PDF, zkusíme ho nahrát do Krabice na náklady.'
    )
  }

  if (parsed.error_description) {
    return `Fakturoid: ${parsed.error_description}`
  }

  if (body.trim()) return `Fakturoid API chyba ${status}: ${body}`
  return `Fakturoid API chyba ${status}`
}

export function isFakturoidUpgradeRequired(status: number, body: string): boolean {
  if (status !== 403) return false
  try {
    const parsed = JSON.parse(body) as FakturoidApiError
    return parsed.error === 'upgrade_required'
  } catch {
    return false
  }
}

/** Vrátí platný access token – automaticky obnoví přes refresh token nebo API klíče. */
export async function getValidFakturoidAccessToken(
  conn: AccountingConnectionRow,
  onTokenUpdate: (tokens: TokenUpdate) => Promise<void>
): Promise<string> {
  if (!conn.fakturoid_oauth_token || !conn.fakturoid_account_slug) {
    throw new Error('Fakturoid není připojen. Jdi do Nastavení → Fakturační systém.')
  }

  const expiresAt = conn.fakturoid_token_expires_at
    ? new Date(conn.fakturoid_token_expires_at).getTime()
    : 0
  const stillValid = expiresAt > Date.now() + 60_000

  if (stillValid) return conn.fakturoid_oauth_token

  if (
    conn.connection_mode === 'api_keys' &&
    conn.fakturoid_client_id &&
    conn.fakturoid_client_secret
  ) {
    const result = await connectFakturoidWithClientCredentials(
      conn.fakturoid_client_id,
      conn.fakturoid_client_secret
    )
    const tokens: TokenUpdate = {
      fakturoid_oauth_token: result.access_token,
      fakturoid_token_expires_at: new Date(
        Date.now() + result.expires_in * 1000
      ).toISOString(),
    }
    await onTokenUpdate(tokens)
    return result.access_token
  }

  if (!conn.fakturoid_refresh_token) {
    throw new Error(
      'Fakturoid token vypršel. Odpoj a znovu připoj účet v Nastavení → Fakturační systém.'
    )
  }

  const refreshed = await refreshFakturoidToken(conn.fakturoid_refresh_token)
  const tokens: TokenUpdate = {
    fakturoid_oauth_token: refreshed.access_token,
    fakturoid_refresh_token: refreshed.refresh_token ?? conn.fakturoid_refresh_token,
    fakturoid_token_expires_at: new Date(
      Date.now() + refreshed.expires_in * 1000
    ).toISOString(),
  }
  await onTokenUpdate(tokens)
  return refreshed.access_token
}

function buildExpensePayload(invoice: InvoiceData, pdfBase64?: string) {
  const payload: Record<string, unknown> = {
    document_type: 'invoice',
    status: 'open',
    issued_on: invoice.datum_vystaveni ?? undefined,
    received_on: invoice.datum_vystaveni ?? undefined,
    due_on: invoice.datum_splatnosti ?? undefined,
    variable_symbol: invoice.variabilni_symbol ?? undefined,
    description: invoice.popis_plneni ?? 'Přijatá faktura',
    private_note: invoice.ucetni_kod ? `Účetní kód: ${invoice.ucetni_kod}` : undefined,
    tags: invoice.ucetni_kod ? [invoice.ucetni_kod] : undefined,
    supplier_name: invoice.dodavatel_nazev ?? 'Neznámý dodavatel',
    supplier_registration_no: invoice.dodavatel_ico ?? undefined,
    supplier_vat_no: invoice.dodavatel_dic ?? undefined,
    lines: [
      {
        name: invoice.popis_plneni ?? 'Přijatá faktura',
        quantity: '1.0',
        unit_name: 'ks',
        unit_price: String(invoice.castka_bez_dph ?? invoice.castka_celkem ?? 0),
        vat_rate: String(invoice.sazba_dph ?? 21),
      },
    ],
  }

  if (pdfBase64) {
    payload.attachments = [
      {
        filename: invoice.original_filename ?? 'faktura.pdf',
        data_url: `data:application/pdf;base64,${pdfBase64}`,
      },
    ]
  }

  return payload
}

async function createFakturoidExpense(
  slug: string,
  accessToken: string,
  invoice: InvoiceData,
  pdfBase64?: string
) {
  const res = await fetch(`${FAKTUROID_API}/accounts/${slug}/expenses.json`, {
    method: 'POST',
    headers: fakturoidHeaders(accessToken, true),
    body: JSON.stringify(buildExpensePayload(invoice, pdfBase64)),
  })

  if (!res.ok) {
    const err = await res.text()
    throw Object.assign(new Error(formatFakturoidError(res.status, err)), {
      status: res.status,
      body: err,
      upgradeRequired: isFakturoidUpgradeRequired(res.status, err),
    })
  }

  const data = await res.json()
  return {
    id: String(data.id),
    url: data.html_url ?? `https://app.fakturoid.cz/${slug}/expenses/${data.id}`,
    mode: 'expense' as const,
  }
}

async function uploadFakturoidInboxFile(
  slug: string,
  accessToken: string,
  pdfBase64: string,
  filename: string
) {
  const res = await fetch(`${FAKTUROID_API}/accounts/${slug}/inbox_files.json`, {
    method: 'POST',
    headers: fakturoidHeaders(accessToken, true),
    body: JSON.stringify({
      attachment: `data:application/pdf;base64,${pdfBase64}`,
      filename,
      send_to_ocr: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(formatFakturoidError(res.status, err))
  }

  const data = await res.json()
  return {
    id: String(data.id),
    url: `https://app.fakturoid.cz/${slug}/inbox_files`,
    mode: 'inbox' as const,
  }
}

export async function sendToFakturoid(
  conn: AccountingConnectionRow,
  invoice: InvoiceData,
  onTokenUpdate: (tokens: TokenUpdate) => Promise<void>,
  pdfBuffer?: Buffer | null
): Promise<{ id: string; url: string; mode?: 'expense' | 'inbox' }> {
  const slug = conn.fakturoid_account_slug!
  const accessToken = await getValidFakturoidAccessToken(conn, onTokenUpdate)
  const pdfBase64 = pdfBuffer ? pdfBuffer.toString('base64') : undefined

  try {
    return await createFakturoidExpense(slug, accessToken, invoice, pdfBase64)
  } catch (err) {
    const upgradeRequired =
      err instanceof Error &&
      'upgradeRequired' in err &&
      (err as Error & { upgradeRequired?: boolean }).upgradeRequired

    if (upgradeRequired && pdfBase64) {
      return uploadFakturoidInboxFile(
        slug,
        accessToken,
        pdfBase64,
        invoice.original_filename ?? 'faktura.pdf'
      )
    }

    if (upgradeRequired) {
      throw new Error(
        'Tvůj tarif Fakturoidu neumožňuje automatické vytvoření výdaje. ' +
          'Přejdi na placený tarif (Na lehko+), použij iDoklad, nebo nahraj novou fakturu ' +
          '(PDF se uloží pro nahrání do Krabice na náklady).'
      )
    }

    throw err
  }
}

export async function testFakturoidConnection(
  conn: AccountingConnectionRow,
  onTokenUpdate: (tokens: TokenUpdate) => Promise<void>
): Promise<{ label: string; plan?: string; expensesApiAvailable?: boolean; warning?: string }> {
  const slug = conn.fakturoid_account_slug!
  const accessToken = await getValidFakturoidAccessToken(conn, onTokenUpdate)

  const res = await fetch(`${FAKTUROID_API}/accounts/${slug}/account.json`, {
    headers: fakturoidHeaders(accessToken),
  })
  if (!res.ok) throw new Error(`Fakturoid test selhal: ${res.status}`)
  const data = await res.json()

  const plan = data.plan as string | undefined
  let warning: string | undefined
  if (plan === 'Zdarma') {
    warning =
      'Tarif Zdarma neumí vytvářet výdaje přes API. Po schválení faktury se PDF nahraje do Krabice na náklady, ' +
      'nebo přejdi na tarif Na lehko+ pro plnou automatizaci.'
  }

  return {
    label: data.name ?? slug,
    plan,
    expensesApiAvailable: plan !== 'Zdarma',
    warning,
  }
}

export type { FakturoidUserAccount }
