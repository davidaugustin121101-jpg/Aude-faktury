import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { getActiveWorkspace } from '@/lib/workspace'

export type AccountingConnectionRow = {
  id: string
  user_id: string
  workspace_id?: string | null
  provider: 'idoklad' | 'fakturoid'
  connection_mode?: 'oauth' | 'api_keys' | null
  idoklad_client_id?: string | null
  idoklad_client_secret?: string | null
  fakturoid_client_id?: string | null
  fakturoid_client_secret?: string | null
  fakturoid_oauth_token?: string | null
  fakturoid_refresh_token?: string | null
  fakturoid_account_slug?: string | null
  fakturoid_token_expires_at?: string | null
  connection_label?: string | null
  is_active: boolean
  last_tested_at?: string | null
  last_test_ok?: boolean | null
}

export async function getWorkspaceConnection(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<AccountingConnectionRow | null> {
  const { data } = await supabase
    .from('accounting_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .maybeSingle()
  return data
}

export async function getActiveWorkspaceConnection(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  fullName?: string | null
): Promise<{ workspace: { id: string; name: string }; connection: AccountingConnectionRow | null }> {
  const workspace = await getActiveWorkspace(supabase, userId, userEmail, fullName)
  const connection = await getWorkspaceConnection(supabase, userId, workspace.id)
  return { workspace, connection }
}

/** @deprecated Použij getWorkspaceConnection / getActiveWorkspaceConnection */
export async function getActiveConnection(
  userId: string
): Promise<AccountingConnectionRow | null> {
  const supabase = await createServerClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', userId)
    .single()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { connection } = await getActiveWorkspaceConnection(
    supabase,
    userId,
    user.email ?? '',
    profile?.full_name
  )
  return connection
}

export async function updateConnectionTokens(
  connectionId: string,
  tokens: {
    fakturoid_oauth_token: string
    fakturoid_refresh_token?: string
    fakturoid_token_expires_at: string
  }
) {
  const supabase = await createServerClient()
  await supabase
    .from('accounting_connections')
    .update(tokens)
    .eq('id', connectionId)
}

export type WorkspaceConnectionSummary = {
  workspaceId: string
  connected: boolean
  provider?: 'idoklad' | 'fakturoid'
  label?: string | null
}

export async function listWorkspaceConnectionSummaries(
  supabase: SupabaseClient,
  userId: string,
  workspaceIds: string[]
): Promise<Record<string, WorkspaceConnectionSummary>> {
  if (workspaceIds.length === 0) return {}

  const { data } = await supabase
    .from('accounting_connections')
    .select('workspace_id, provider, connection_label')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('workspace_id', workspaceIds)

  const map: Record<string, WorkspaceConnectionSummary> = {}
  for (const id of workspaceIds) {
    map[id] = { workspaceId: id, connected: false }
  }
  for (const row of data ?? []) {
    if (!row.workspace_id) continue
    map[row.workspace_id] = {
      workspaceId: row.workspace_id,
      connected: true,
      provider: row.provider,
      label: row.connection_label,
    }
  }
  return map
}
