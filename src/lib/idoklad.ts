import type { ExtractedInvoiceData } from './claude'

const IDOKLAD_API_BASE = 'https://api.idoklad.cz/v3'
const IDOKLAD_TOKEN_URL = 'https://app.idoklad.cz/identity/server/connect/token'

// VatRateType: 3=exempt(0%), 2=reduced(10%/12%), 1=standard(21%)
function mapDphSazba(sazba: number): number {
  if (sazba === 0) return 3
  if (sazba === 12 || sazba === 10) return 2
  return 1
}

function normalizeIdokladDate(value: string | null | undefined, fallback: string): string {
  const d = (value ?? '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : fallback
}

/** iDoklad vyžaduje DateOfMaturity >= DateOfIssue a povinné DateOfReceiving. */
function buildIdokladDates(data: ExtractedInvoiceData): {
  issue: string
  maturity: string
  receiving: string
} {
  const today = new Date().toISOString().slice(0, 10)
  const issue = normalizeIdokladDate(data.datum_vystaveni, today)
  let maturity = normalizeIdokladDate(data.datum_splatnosti, issue)
  if (maturity < issue) maturity = issue
  const receiving = issue
  return { issue, maturity, receiving }
}

/** Get an OAuth2 access token via client_credentials flow */
async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(IDOKLAD_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'idoklad_api',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`iDoklad token chyba ${res.status}: ${err}`)
  }
  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

export interface IdokladConnection {
  provider: 'idoklad'
  /** OAuth2 Client ID */
  client_id: string | null
  /** Decrypted client secret */
  client_secret: string
  /** Legacy Bearer token (used when client_id is not set) */
  api_key?: string
}

export async function sendToIdoklad(
  connection: IdokladConnection,
  data: ExtractedInvoiceData
): Promise<{ id: string; documentNumber: string }> {
  let token: string
  if (connection.client_id) {
    token = await getAccessToken(connection.client_id, connection.client_secret)
  } else {
    // Fall back to direct Bearer token (legacy)
    token = connection.client_secret
  }

  const { issue, maturity, receiving } = buildIdokladDates(data)

  const payload = {
    DateOfIssue: issue,
    DateOfMaturity: maturity,
    DateOfReceiving: receiving,
    VariableSymbol: data.variabilni_symbol,
    Description: data.popis_plneni ?? 'Přijatá faktura',
    AccountingCode: data.ucetni_kod ?? '518',
    Supplier: {
      CompanyName: data.dodavatel_nazev,
      IdentificationNumber: data.dodavatel_ico,
      ...(data.dodavatel_dic ? { TaxIdentificationNumber: data.dodavatel_dic } : {}),
    },
    Items: [
      {
        Name: (data.popis_plneni ?? 'Přijatá faktura').slice(0, 200),
        Amount: 1,
        Unit: 'ks',
        PriceType: 0,
        Price: data.castka_bez_dph ?? data.castka_celkem ?? 0,
        VatRateType: mapDphSazba(data.sazba_dph ?? 21),
      },
    ],
    CurrencyId: data.mena === 'CZK' ? 'CZK' : data.mena,
  }

  const res = await fetch(`${IDOKLAD_API_BASE}/ReceivedInvoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`iDoklad API chyba ${res.status}: ${err}`)
  }

  const result = (await res.json()) as { Id: string; DocumentNumber: string }
  return { id: String(result.Id), documentNumber: result.DocumentNumber }
}

/** Validate iDoklad credentials (client_credentials or legacy Bearer token) */
export async function validateIdokladConnection(
  clientId: string | null,
  clientSecret: string
): Promise<boolean> {
  try {
    let token: string
    if (clientId) {
      token = await getAccessToken(clientId, clientSecret)
    } else {
      token = clientSecret
    }
    const res = await fetch(`${IDOKLAD_API_BASE}/ReceivedInvoices?page=1&pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

/** @deprecated Use validateIdokladConnection */
export async function validateIdokladToken(apiKey: string): Promise<boolean> {
  return validateIdokladConnection(null, apiKey)
}
