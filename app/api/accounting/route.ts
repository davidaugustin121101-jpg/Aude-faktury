import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { testIdokladConnection } from '@/lib/idoklad'
import { testFakturoidConnection } from '@/lib/fakturoid'
import {
  connectFakturoidWithClientCredentials,
  tokenExpiresAt,
} from '@/lib/fakturoid-oauth'
import {
  getActiveWorkspaceConnection,
  getWorkspaceConnection,
  updateConnectionTokens,
} from '@/lib/accounting-connection'
import { getActiveWorkspace } from '@/lib/workspace'

function connectionPayload(
  workspace: { id: string; name: string },
  data: {
    provider: string
    connection_label?: string | null
    connection_mode?: string | null
    fakturoid_account_slug?: string | null
    fakturoid_client_id?: string | null
    fakturoid_client_secret?: string | null
    idoklad_client_id?: string | null
    idoklad_client_secret?: string | null
    last_tested_at?: string | null
    last_test_ok?: boolean | null
  } | null
) {
  if (!data) {
    return {
      connected: false,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    }
  }
  return {
    connected: true,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    provider: data.provider,
    label: data.connection_label,
    fakturoidSlug: data.fakturoid_account_slug,
    connectionMode: data.connection_mode,
    fakturoidClientId: data.fakturoid_client_id,
    hasFakturoidSecret: Boolean(data.fakturoid_client_secret),
    idokladClientId: data.idoklad_client_id,
    hasIdokladSecret: Boolean(data.idoklad_client_secret),
    lastTestedAt: data.last_tested_at,
    lastTestOk: data.last_test_ok,
  }
}

export async function GET() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { workspace, connection } = await getActiveWorkspaceConnection(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  return NextResponse.json(connectionPayload(workspace, connection))
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  const body = await req.json()
  const {
    action,
    idoklad_client_id,
    idoklad_client_secret,
    fakturoid_client_id,
    fakturoid_client_secret,
    fakturoid_account_slug,
  } = body

  if (action === 'test-idoklad') {
    if (!idoklad_client_id?.trim()) {
      return NextResponse.json({ error: 'Vyplň Client ID.' }, { status: 400 })
    }

    let secret = idoklad_client_secret?.trim()
    if (!secret) {
      const existing = await getWorkspaceConnection(supabase, user.id, workspace.id)
      secret = existing?.idoklad_client_secret ?? ''
    }
    if (!secret) {
      return NextResponse.json({ error: 'Vyplň Client Secret.' }, { status: 400 })
    }

    try {
      const result = await testIdokladConnection({
        idoklad_client_id: idoklad_client_id.trim(),
        idoklad_client_secret: secret,
      })
      return NextResponse.json({ ok: true, label: result.label })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test selhal'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  if (action === 'save-idoklad') {
    if (!idoklad_client_id?.trim()) {
      return NextResponse.json({ error: 'Vyplň Client ID.' }, { status: 400 })
    }

    let secret = idoklad_client_secret?.trim()
    if (!secret) {
      const existing = await getWorkspaceConnection(supabase, user.id, workspace.id)
      secret = existing?.idoklad_client_secret ?? ''
    }
    if (!secret) {
      return NextResponse.json({ error: 'Vyplň Client Secret.' }, { status: 400 })
    }

    try {
      const result = await testIdokladConnection({
        idoklad_client_id: idoklad_client_id.trim(),
        idoklad_client_secret: secret,
      })

      await supabase
        .from('accounting_connections')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('workspace_id', workspace.id)

      const { error } = await supabase.from('accounting_connections').insert({
        user_id: user.id,
        workspace_id: workspace.id,
        provider: 'idoklad',
        idoklad_client_id: idoklad_client_id.trim(),
        idoklad_client_secret: secret,
        connection_label: result.label,
        is_active: true,
        last_tested_at: new Date().toISOString(),
        last_test_ok: true,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, label: result.label, workspaceName: workspace.name })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Uložení selhalo'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  if (action === 'save-fakturoid-api') {
    if (!fakturoid_client_id?.trim()) {
      return NextResponse.json(
        { error: 'Vyplň Client ID z Fakturoidu (Nastavení → Uživatelský účet).' },
        { status: 400 }
      )
    }

    let secret = fakturoid_client_secret?.trim()
    if (!secret) {
      const existing = await getWorkspaceConnection(supabase, user.id, workspace.id)
      secret = existing?.fakturoid_client_secret ?? ''
    }
    if (!secret) {
      return NextResponse.json(
        { error: 'Vyplň Client Secret z Fakturoidu (Nastavení → Uživatelský účet).' },
        { status: 400 }
      )
    }

    try {
      const result = await connectFakturoidWithClientCredentials(
        fakturoid_client_id.trim(),
        secret
      )
      const slug = fakturoid_account_slug?.trim() || result.account.slug

      await supabase
        .from('accounting_connections')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('workspace_id', workspace.id)

      const { error } = await supabase.from('accounting_connections').insert({
        user_id: user.id,
        workspace_id: workspace.id,
        provider: 'fakturoid',
        connection_mode: 'api_keys',
        fakturoid_client_id: fakturoid_client_id.trim(),
        fakturoid_client_secret: secret,
        fakturoid_oauth_token: result.access_token,
        fakturoid_token_expires_at: tokenExpiresAt(result.expires_in),
        fakturoid_account_slug: slug,
        connection_label: result.account.name,
        is_active: true,
        last_tested_at: new Date().toISOString(),
        last_test_ok: true,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({
        ok: true,
        label: result.account.name,
        slug,
        workspaceName: workspace.name,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Uložení selhalo'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  if (action === 'test-fakturoid') {
    const conn = await getWorkspaceConnection(supabase, user.id, workspace.id)

    if (!conn || conn.provider !== 'fakturoid') {
      return NextResponse.json(
        { error: `Fakturoid není připojen pro klienta „${workspace.name}".` },
        { status: 400 }
      )
    }

    try {
      const result = await testFakturoidConnection(conn, async (tokens) => {
        await updateConnectionTokens(conn.id, tokens)
      })
      await supabase
        .from('accounting_connections')
        .update({ last_tested_at: new Date().toISOString(), last_test_ok: true })
        .eq('id', conn.id)
      return NextResponse.json({
        ok: true,
        label: result.label,
        plan: result.plan,
        warning: result.warning,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test selhal'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  return NextResponse.json({ error: 'Neplatná akce' }, { status: 400 })
}

export async function DELETE() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  await supabase
    .from('accounting_connections')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)

  return NextResponse.json({ ok: true, workspaceName: workspace.name })
}
