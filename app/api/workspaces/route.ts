import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import {
  listWorkspaces,
  createClientWorkspace,
  switchWorkspace,
  enableAccountantMode,
  getActiveWorkspace,
} from '@/lib/workspace'
import { listWorkspaceConnectionSummaries } from '@/lib/accounting-connection'

export async function GET() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_accountant, full_name')
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
    isAccountant: profile?.is_accountant ?? false,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

  const body = await req.json()
  const { action, name, workspaceId } = body

  if (action === 'create') {
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Zadej název klienta' }, { status: 400 })
    }
    const ws = await createClientWorkspace(supabase, user.id, name)
    await enableAccountantMode(supabase, user.id)
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
    await enableAccountantMode(supabase, user.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Neplatná akce' }, { status: 400 })
}
