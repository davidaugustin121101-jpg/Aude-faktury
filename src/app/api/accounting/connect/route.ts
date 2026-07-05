import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateIdokladConnection } from '@/lib/idoklad'
import { validateFakturoidToken, validateFakturoidClientCredentials, validateFakturoidExpenseWrite } from '@/lib/fakturoid'
import { validateSuperFakturaConnection } from '@/lib/superfaktura'
import { getActiveWorkspace } from '@/lib/workspace'
import type { CountryCode } from '@/lib/accounting-codes'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { provider, apiKey, accountSlug, clientId, clientSecret, apiEmail, companyId, country } =
    body as {
      provider: string
      apiKey?: string
      accountSlug?: string
      clientId?: string
      clientSecret?: string
      apiEmail?: string
      companyId?: string
      country?: CountryCode
    }

  if (!provider) {
    return NextResponse.json({ error: 'Chybí provider' }, { status: 400 })
  }

  const connCountry: CountryCode = country === 'sk' ? 'sk' : 'cz'

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
        country: connCountry,
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

  const connData: Record<string, unknown> = {
    user_id: user.id,
    workspace_id: workspace.id,
    provider,
    is_active: true,
    country: connCountry,
    last_tested_at: new Date().toISOString(),
    last_test_ok: true,
  }

  if (provider === 'idoklad') {
    connData.idoklad_client_id = clientId ?? null
    connData.idoklad_client_secret = clientSecret ?? apiKey ?? ''
    connData.fakturoid_oauth_token = null
    connData.fakturoid_account_slug = null
    connData.superfaktura_api_email = null
    connData.superfaktura_api_key = null
    connData.superfaktura_company_id = null
  } else if (provider === 'superfaktura') {
    connData.superfaktura_api_email = apiEmail ?? null
    connData.superfaktura_api_key = apiKey ?? null
    connData.superfaktura_company_id = companyId ?? ''
    connData.idoklad_client_id = null
    connData.idoklad_client_secret = null
    connData.fakturoid_oauth_token = null
    connData.fakturoid_account_slug = null
  } else {
    connData.fakturoid_client_id = clientId ?? null
    connData.fakturoid_client_secret = clientSecret ?? null
    connData.fakturoid_oauth_token = fakturoidAutoToken ?? apiKey ?? null
    connData.fakturoid_account_slug = fakturoidAutoSlug ?? accountSlug ?? null
    connData.fakturoid_token_expires_at = fakturoidAutoExpires
    connData.idoklad_client_id = null
    connData.idoklad_client_secret = null
    connData.superfaktura_api_email = null
    connData.superfaktura_api_key = null
    connData.superfaktura_company_id = null
  }

  // Jeden fakturační systém na workspace — deaktivujeme ostatní (service role)
  const admin = createAdminClient()

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
    await admin.from('accounting_connections').update(connData).eq('id', existing.id)
  } else {
    await admin.from('accounting_connections').insert(connData)
  }

  return NextResponse.json({ ok: true })
}
