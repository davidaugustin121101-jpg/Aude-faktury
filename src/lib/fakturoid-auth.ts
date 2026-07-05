import { USER_AGENT } from '@/lib/brand'

const FAKTUROID_API = 'https://app.fakturoid.cz/api/v3'
export const FAKTUROID_USER_AGENT = USER_AGENT

export type FakturoidAccount = {
  slug: string
  name: string
  allowed_scope?: string[]
}

function basicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

export async function fetchFakturoidUser(accessToken: string) {
  const res = await fetch(`${FAKTUROID_API}/user.json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': FAKTUROID_USER_AGENT,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fakturoid user info chyba ${res.status}: ${err}`)
  }
  return res.json() as Promise<{
    default_account: string | null
    accounts: FakturoidAccount[]
  }>
}

export function pickFakturoidAccount(user: {
  default_account: string | null
  accounts: FakturoidAccount[]
}) {
  const withExpenses = user.accounts.filter((a) => a.allowed_scope?.includes('expenses'))
  if (user.default_account) {
    const def = withExpenses.find((a) => a.slug === user.default_account)
    if (def) return def
  }
  if (withExpenses.length > 0) return withExpenses[0]
  if (user.accounts.length > 0) return user.accounts[0]
  throw new Error('Fakturoid účet nemá firmu s přístupem k nákladům (expenses).')
}

export async function connectFakturoidWithClientCredentials(
  clientId: string,
  clientSecret: string
) {
  const res = await fetch(`${FAKTUROID_API}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(clientId, clientSecret),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': FAKTUROID_USER_AGENT,
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })
  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(
      `Fakturoid API klíče nejsou platné (${res.status}). Zkontrolujte Client ID a Secret v Nastavení → Uživatelský účet → API. ${errBody}`
    )
  }
  const tokens = (await res.json()) as { access_token: string; expires_in: number }
  const user = await fetchFakturoidUser(tokens.access_token)
  const account = pickFakturoidAccount(user)
  return {
    access_token: tokens.access_token,
    expires_in: tokens.expires_in,
    account,
  }
}

export function tokenExpiresAt(expiresInSeconds: number) {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

export type FakturoidConnectionRow = {
  fakturoid_oauth_token?: string | null
  fakturoid_account_slug?: string | null
  fakturoid_client_id?: string | null
  fakturoid_client_secret?: string | null
  fakturoid_token_expires_at?: string | null
}

/** Vrátí platný Bearer token — obnoví přes client_credentials pokud je k dispozici. */
export async function getFakturoidAccessToken(
  conn: FakturoidConnectionRow
): Promise<{ token: string; slug: string }> {
  const slug = conn.fakturoid_account_slug ?? ''
  if (!slug) throw new Error('Chybí slug Fakturoid účtu')

  const expiresAt = conn.fakturoid_token_expires_at
    ? new Date(conn.fakturoid_token_expires_at).getTime()
    : 0
  const tokenStillValid =
    conn.fakturoid_oauth_token && expiresAt > Date.now() + 60_000

  if (tokenStillValid) {
    return { token: conn.fakturoid_oauth_token!, slug }
  }

  if (conn.fakturoid_client_id && conn.fakturoid_client_secret) {
    const fresh = await connectFakturoidWithClientCredentials(
      conn.fakturoid_client_id,
      conn.fakturoid_client_secret
    )
    return { token: fresh.access_token, slug: fresh.account.slug }
  }

  if (conn.fakturoid_oauth_token) {
    return { token: conn.fakturoid_oauth_token, slug }
  }

  throw new Error('Fakturoid není správně připojen — chybí API klíče nebo token.')
}
