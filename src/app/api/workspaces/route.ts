import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasActiveAccountantSubscription } from '@/lib/account-mode'
import {
  listWorkspaces,
  createClientWorkspace,
  switchWorkspace,
  getActiveWorkspace,
} from '@/lib/workspace'
import { listWorkspaceConnectionSummaries } from '@/lib/accounting-connection'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_accountant, stripe_subscription_id, full_name')
    .eq('id', user.id)
    .single()

  const workspaces = await listWorkspaces(supabase, user.id)
  const active = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  const connections = await listWorkspaceConnectionSummaries(
    supabase,
    user.id,
    workspaces.map((w) => w.id)
  )

  const workspacesWithConnections = workspaces.map((ws) => ({
    ...ws,
    accounting: connections[ws.id] ?? { connected: false, workspaceId: ws.id },
  }))

  return NextResponse.json({
    workspaces: workspacesWithConnections,
    activeWorkspaceId: active.id,
    activeWorkspaceName: active.name,
    isAccountant: hasActiveAccountantSubscription(profile),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const body = await req.json()
  const { action, name, workspaceId } = body

  if (action === 'create') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_accountant, stripe_subscription_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!hasActiveAccountantSubscription(profile)) {
      return NextResponse.json(
        {
          error:
            'Režim pro účetní firmy je dostupný v předplatném za 299 Kč/měsíc. Přejděte do Nastavení → Předplatné.',
          upgrade: true,
        },
        { status: 403 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Zadej název klienta' }, { status: 400 })
    }
    const ws = await createClientWorkspace(supabase, user.id, name)
    await switchWorkspace(supabase, user.id, ws.id)
    return NextResponse.json({ workspace: ws })
  }

  if (action === 'switch') {
    if (!workspaceId) {
      return NextResponse.json({ error: 'Chybí workspaceId' }, { status: 400 })
    }
    await switchWorkspace(supabase, user.id, workspaceId)
    const { data: ws } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .single()
    return NextResponse.json({ ok: true, workspace: ws })
  }

  if (action === 'enable-accountant') {
    return NextResponse.json(
      {
        error:
          'Aktivace režimu účetní firmy probíhá přes předplatné za 299 Kč/měsíc.',
        upgrade: true,
      },
      { status: 403 }
    )
  }

  return NextResponse.json({ error: 'Neplatná akce' }, { status: 400 })
}
