const FAKTUROID_API = 'https://app.fakturoid.cz/api/v3'
const USER_AGENT = 'Audeflow Faktury (podpora@audeflow.cz)'

function getAppCredentials() {
  const clientId = process.env.FAKTUROID_CLIENT_ID
  const clientSecret = process.env.FAKTUROID_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error(
      'Fakturoid OAuth není nakonfigurován (FAKTUROID_CLIENT_ID / FAKTUROID_CLIENT_SECRET).'
    )
  }
  return { clientId, clientSecret }
}

function basicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

export function getFakturoidRedirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/accounting/fakturoid/callback`
}

/** Fakturoid odmítá localhost → vrací HTTP 400 s prázdnou stránkou. */
export function validateFakturoidOAuthSetup(): {
  ok: boolean
  redirectUri: string
  error?: string
} {
  const redirectUri = getFakturoidRedirectUri()
  let host: string
  try {
    host = new URL(redirectUri).hostname
  } catch {
    return { ok: false, redirectUri, error: 'NEXT_PUBLIC_APP_URL není platná URL.' }
  }

  if (host === 'localhost' || host === '127.0.0.1') {
    return {
      ok: false,
      redirectUri,
      error:
        'Fakturoid nepodporuje localhost. Nastav v /etc/hosts doménu faktury.local a NEXT_PUBLIC_APP_URL=http://faktury.local:3000.',
    }
  }

  return { ok: true, redirectUri }
}

export async function probeFakturoidOAuthAuthorizeUrl(
  authorizeUrl: string
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(authorizeUrl, { method: 'GET', redirect: 'manual' })
  // 400 + prázdné tělo = špatný redirect_uri nebo neregistrovaná integrace
  return { ok: res.status !== 400, status: res.status }
}

export function buildFakturoidAuthorizeUrl(state: string) {
  const { clientId } = getAppCredentials()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getFakturoidRedirectUri(),
    response_type: 'code',
    state,
  })
  return `${FAKTUROID_API}/oauth?${params.toString()}`
}

export async function exchangeFakturoidCode(code: string) {
  const { clientId, clientSecret } = getAppCredentials()
  const res = await fetch(`${FAKTUROID_API}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(clientId, clientSecret),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getFakturoidRedirectUri(),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fakturoid OAuth chyba: ${err}`)
  }
  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }>
}

export async function refreshFakturoidToken(refreshToken: string) {
  const { clientId, clientSecret } = getAppCredentials()
  const res = await fetch(`${FAKTUROID_API}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(clientId, clientSecret),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fakturoid refresh token chyba: ${err}`)
  }
  return res.json() as Promise<{
    access_token: string
    expires_in: number
    refresh_token?: string
  }>
}

export interface FakturoidUserAccount {
  slug: string
  name: string
  allowed_scope?: string[]
}

export async function fetchFakturoidUser(accessToken: string) {
  const res = await fetch(`${FAKTUROID_API}/user.json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  })
  if (!res.ok) throw new Error(`Fakturoid user info chyba: ${res.status}`)
  return res.json() as Promise<{
    default_account: string | null
    accounts: FakturoidUserAccount[]
  }>
}

export function pickFakturoidAccount(user: {
  default_account: string | null
  accounts: FakturoidUserAccount[]
}) {
  const withExpenses = user.accounts.filter((a) =>
    a.allowed_scope?.includes('expenses')
  )
  if (user.default_account) {
    const def = withExpenses.find((a) => a.slug === user.default_account)
    if (def) return def
  }
  if (withExpenses.length > 0) return withExpenses[0]
  if (user.accounts.length > 0) return user.accounts[0]
  throw new Error('Fakturoid účet nemá žádnou firmu s přístupem k API.')
}

export function tokenExpiresAt(expiresInSeconds: number) {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

/** Client Credentials – vlastní účet (Nastavení → Uživatelský účet). Pro MVP test bez OAuth redirectu. */
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
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })
  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(
      `Fakturoid API klíče nejsou platné (${res.status}). Použij klíče z Nastavení → Uživatelský účet. ${errBody}`
    )
  }
  const tokens = await res.json()
  const user = await fetchFakturoidUser(tokens.access_token)
  const account = pickFakturoidAccount(user)
  return {
    access_token: tokens.access_token as string,
    expires_in: tokens.expires_in as number,
    account,
  }
}
