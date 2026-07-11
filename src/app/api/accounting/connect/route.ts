import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateIdokladConnection } from '@/lib/idoklad'
import {
  validateFakturoidToken,
  validateFakturoidClientCredentials,
  validateFakturoidExpenseWrite,
} from '@/lib/fakturoid'
import { validateSuperFakturaConnection } from '@/lib/superfaktura'
import { validateBitFakturaConnection } from '@/lib/bitfaktura'
import { validateSuctoConnection } from '@/lib/sucto'
import { getActiveWorkspace } from '@/lib/workspace'
import { storeVaultSecret } from '@/lib/vault-secrets'
import { checkRateLimit } from '@/lib/rate-limit'

function vaultStoreFailed() {
  return NextResponse.json(
    { error: 'Nepodařilo se bezpečně uložit přihlašovací údaje. Zkuste to znovu nebo kontaktujte podporu.' },
    { status: 500 }
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`accounting-connect:${user.id}`, 10, 60_000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Příliš mnoho pokusů. Zkuste znovu za ${rate.retryAfterSec ?? 60} s.` },
      { status: 429 }
    )
  }

  const body = await req.json()
  const { provider, apiKey, accountSlug, clientId, clientSecret, apiEmail, companyId, suctoPassword } =
    body as {
      provider: string
      apiKey?: string
      accountSlug?: string
      clientId?: string
      clientSecret?: string
      apiEmail?: string
      companyId?: string
      suctoPassword?: string
    }

  if (!provider) {
    return NextResponse.json({ error: 'Chybí provider' }, { status: 400 })
  }

  const connCountry = 'cz' as const

  let valid = false
  let fakturoidAutoSlug: string | null = null
  let fakturoidAutoToken: string | null = null
  let fakturoidAutoExpires: string | null = null

  try {
    if (provider === 'idoklad') {
      const id = clientId ?? null
      const secret = clientSecret ?? apiKey ?? ''
      if (!secret) {
        return NextResponse.json({ error: 'Chybí Client Secret nebo API klíč' }, { status: 400 })
      }
      valid = await validateIdokladConnection(id, secret)
    } else if (provider === 'fakturoid') {
      if (clientId && clientSecret) {
        const result = await validateFakturoidClientCredentials(clientId, clientSecret)
        if (!result.ok) {
          return NextResponse.json(
            {
              error:
                result.message ??
                'Neplatné Fakturoid API klíče. V Fakturoidu: Nastavení → Uživatelský účet → API → vytvořte integraci a zkopírujte Client ID + Secret.',
            },
            { status: 400 }
          )
        }
        valid = true
        fakturoidAutoSlug = result.slug
        fakturoidAutoToken = result.token
        fakturoidAutoExpires = result.expiresAt
      } else if (accountSlug && apiKey) {
        const canRead = await validateFakturoidToken(apiKey, accountSlug)
        if (!canRead) {
          return NextResponse.json(
            {
              error:
                'Neplatný Fakturoid token nebo slug. Použijte raději Client ID + Client Secret z Nastavení → API.',
            },
            { status: 400 }
          )
        }
        const writeCheck = await validateFakturoidExpenseWrite(apiKey, accountSlug)
        if (!writeCheck.ok) {
          return NextResponse.json({ error: writeCheck.message }, { status: 400 })
        }
        valid = true
      } else {
        return NextResponse.json(
          { error: 'Vyplňte Client ID + Client Secret, nebo slug + OAuth token' },
          { status: 400 }
        )
      }
    } else if (provider === 'superfaktura') {
      if (!apiEmail || !apiKey) {
        return NextResponse.json({ error: 'Chybí email nebo API klíč SuperFaktury' }, { status: 400 })
      }
      valid = await validateSuperFakturaConnection({
        email: apiEmail,
        apiKey,
        companyId: companyId ?? '',
      })
      if (!valid) {
        return NextResponse.json(
          {
            error:
              'SuperFaktura odmítla přihlášení. Zkontrolujte email a API klíč v Nástroje → API přístup. Pro více firem vyplňte Company ID. Uživatel musí mít roli Administrátor.',
          },
          { status: 400 }
        )
      }
    } else if (provider === 'bitfaktura') {
      if (!accountSlug || !apiKey) {
        return NextResponse.json(
          { error: 'Vyplňte subdoménu BitFaktury a API token' },
          { status: 400 }
        )
      }
      valid = await validateBitFakturaConnection({ domain: accountSlug, apiToken: apiKey })
      if (!valid) {
        return NextResponse.json(
          {
            error:
              'BitFaktura odmítla přihlášení. Zkontrolujte subdoménu (např. mojefirma) a token z Nastavení → Integrace → Autorizační kód API.',
          },
          { status: 400 }
        )
      }
    } else if (provider === 'sucto') {
      const password = suctoPassword ?? apiKey
      if (!apiEmail || !password || !companyId) {
        return NextResponse.json(
          { error: 'Vyplňte e-mail, heslo a ID firmy ve Súčtu' },
          { status: 400 }
        )
      }
      valid = await validateSuctoConnection({
        email: apiEmail,
        password,
        companyId,
      })
      if (!valid) {
        return NextResponse.json(
          {
            error:
              'Súčto odmítlo přihlášení. Zkontrolujte přihlašovací údaje a ID firmy (číslo v URL po přihlášení na moje.sucto.cz).',
          },
          { status: 400 }
        )
      }
    }
  } catch {
    return NextResponse.json({ error: 'Nepodařilo se ověřit přihlašovací údaje' }, { status: 400 })
  }

  if (!valid) {
    return NextResponse.json({ error: 'Neplatné přihlašovací údaje' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, is_accountant')
    .eq('id', user.id)
    .maybeSingle()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  const admin = createAdminClient()
  const vaultPrefix = `acct_${user.id}_${workspace.id}_${provider}`

  const connData: Record<string, unknown> = {
    user_id: user.id,
    workspace_id: workspace.id,
    provider,
    is_active: true,
    country: connCountry,
    last_tested_at: new Date().toISOString(),
    last_test_ok: true,
    idoklad_client_secret: null,
    fakturoid_oauth_token: null,
    fakturoid_client_secret: null,
    superfaktura_api_key: null,
  }

  if (provider === 'idoklad') {
    const secret = clientSecret ?? apiKey ?? ''
    connData.idoklad_client_id = clientId ?? null
    const secretId = await storeVaultSecret(
      admin,
      secret,
      `${vaultPrefix}_idoklad_secret`,
      'iDoklad client secret'
    )
    if (!secretId) return vaultStoreFailed()
    connData.idoklad_client_secret_id = secretId
    connData.fakturoid_account_slug = null
    connData.superfaktura_api_email = null
    connData.superfaktura_company_id = null
  } else if (provider === 'superfaktura') {
    connData.superfaktura_api_email = apiEmail ?? null
    const keyId = await storeVaultSecret(
      admin,
      apiKey ?? '',
      `${vaultPrefix}_superfaktura_key`,
      'SuperFaktura API key'
    )
    if (!keyId) return vaultStoreFailed()
    connData.superfaktura_api_key_id = keyId
    connData.superfaktura_company_id = companyId ?? ''
    connData.idoklad_client_id = null
    connData.fakturoid_account_slug = null
  } else if (provider === 'bitfaktura') {
    connData.bitfaktura_domain = accountSlug ?? null
    const tokenId = await storeVaultSecret(
      admin,
      apiKey ?? '',
      `${vaultPrefix}_bitfaktura_token`,
      'BitFaktura API token'
    )
    if (!tokenId) return vaultStoreFailed()
    connData.bitfaktura_api_token_id = tokenId
    connData.idoklad_client_id = null
    connData.fakturoid_account_slug = null
    connData.superfaktura_api_email = null
    connData.superfaktura_company_id = null
    connData.sucto_email = null
    connData.sucto_company_id = null
  } else if (provider === 'sucto') {
    const password = suctoPassword ?? apiKey ?? ''
    connData.sucto_email = apiEmail ?? null
    connData.sucto_company_id = companyId ?? null
    const passwordId = await storeVaultSecret(
      admin,
      password,
      `${vaultPrefix}_sucto_password`,
      'Súčto password'
    )
    if (!passwordId) return vaultStoreFailed()
    connData.sucto_password_id = passwordId
    connData.idoklad_client_id = null
    connData.fakturoid_account_slug = null
    connData.superfaktura_api_email = null
    connData.superfaktura_company_id = null
    connData.bitfaktura_domain = null
  } else {
    const token = fakturoidAutoToken ?? apiKey ?? null
    const secret = clientSecret ?? null
    connData.fakturoid_client_id = clientId ?? null
    if (secret) {
      const secretId = await storeVaultSecret(
        admin,
        secret,
        `${vaultPrefix}_fakturoid_secret`,
        'Fakturoid secret'
      )
      if (!secretId) return vaultStoreFailed()
      connData.fakturoid_client_secret_id = secretId
    }
    if (token) {
      const tokenId = await storeVaultSecret(
        admin,
        token,
        `${vaultPrefix}_fakturoid_token`,
        'Fakturoid token'
      )
      if (!tokenId) return vaultStoreFailed()
      connData.fakturoid_oauth_token_id = tokenId
    }
    connData.fakturoid_account_slug = fakturoidAutoSlug ?? accountSlug ?? null
    connData.fakturoid_token_expires_at = fakturoidAutoExpires
    connData.idoklad_client_id = null
    connData.superfaktura_api_email = null
    connData.superfaktura_company_id = null
  }

  await admin
    .from('accounting_connections')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .neq('provider', provider)

  await admin
    .from('accounting_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .neq('provider', provider)

  const { data: existing } = await admin
    .from('accounting_connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .eq('provider', provider)
    .maybeSingle()

  if (existing) {
    const { error: updateError } = await admin
      .from('accounting_connections')
      .update(connData)
      .eq('id', existing.id)
    if (updateError) {
      return NextResponse.json({ error: 'Nepodařilo se uložit připojení' }, { status: 500 })
    }
  } else {
    const { error: insertError } = await admin.from('accounting_connections').insert(connData)
    if (insertError) {
      return NextResponse.json({ error: 'Nepodařilo se uložit připojení' }, { status: 500 })
    }
  }

  const { data: verifyRow, error: verifyError } = await admin
    .from('accounting_connections')
    .select('id, provider, workspace_id, is_active')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .eq('provider', provider)
    .eq('is_active', true)
    .maybeSingle()

  if (verifyError || !verifyRow) {
    return NextResponse.json({ error: 'Připojení se nepodařilo ověřit po uložení' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
