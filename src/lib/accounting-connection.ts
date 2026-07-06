import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { hydrateConnectionSecrets } from '@/lib/vault-secrets'

export type AccountingProvider = 'idoklad' | 'fakturoid' | 'superfaktura'

export type WorkspaceConnectionSummary = {
  workspaceId: string
  connected: boolean
  provider?: AccountingProvider
  label?: string | null
}

export async function getConnectionWithSecrets(userId: string, workspaceId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('accounting_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getConnectionWithSecrets error:', error.message)
  }

  if (!data) return null
  return hydrateConnectionSecrets(admin, data as Record<string, unknown>)
}

export async function getConnectionForInvoiceWithSecrets(
  userId: string,
  userEmail: string,
  fullName: string | null | undefined,
  workspaceId?: string | null
) {
  if (workspaceId) {
    return getConnectionWithSecrets(userId, workspaceId)
  }
  const admin = createAdminClient()
  const { getActiveWorkspace } = await import('@/lib/workspace')
  const workspace = await getActiveWorkspace(admin, userId, userEmail, fullName)
  return getConnectionWithSecrets(userId, workspace.id)
}

export async function getWorkspaceConnection(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
) {
  const { data, error } = await supabase
    .from('accounting_connections')
    .select('id, provider, user_id, workspace_id, is_active, created_at, fakturoid_account_slug, superfaktura_company_id, country')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getWorkspaceConnection error:', error.message)
  }

  return data
}

export async function getActiveWorkspaceConnection(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  fullName?: string | null
) {
  const { getActiveWorkspace } = await import('@/lib/workspace')
  const workspace = await getActiveWorkspace(supabase, userId, userEmail, fullName)
  const connection = await getWorkspaceConnection(supabase, userId, workspace.id)
  return { workspace, connection }
}

export async function listWorkspaceConnectionSummaries(
  supabase: SupabaseClient,
  userId: string,
  workspaceIds: string[]
): Promise<Record<string, WorkspaceConnectionSummary>> {
  if (workspaceIds.length === 0) return {}

  const { data } = await supabase
    .from('accounting_connections')
    .select('workspace_id, provider, fakturoid_account_slug, superfaktura_company_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('workspace_id', workspaceIds)

  const map: Record<string, WorkspaceConnectionSummary> = {}
  for (const id of workspaceIds) {
    map[id] = { workspaceId: id, connected: false }
  }
  for (const row of data ?? []) {
    if (!row.workspace_id) continue
    const label =
      row.provider === 'fakturoid'
        ? row.fakturoid_account_slug
        : row.provider === 'superfaktura'
          ? row.superfaktura_company_id || 'SuperFaktura'
          : 'iDoklad'
    map[row.workspace_id] = {
      workspaceId: row.workspace_id,
      connected: true,
      provider: row.provider as AccountingProvider,
      label,
    }
  }
  return map
}

export async function getConnectionForInvoice(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  fullName: string | null | undefined,
  workspaceId?: string | null
) {
  if (workspaceId) {
    return getWorkspaceConnection(supabase, userId, workspaceId)
  }
  const { connection } = await getActiveWorkspaceConnection(
    supabase,
    userId,
    userEmail,
    fullName
  )
  return connection
}

export function providerDisplayName(provider: AccountingProvider | string): string {
  if (provider === 'idoklad') return 'iDoklad'
  if (provider === 'superfaktura') return 'SuperFaktura'
  return 'Fakturoid'
}

export function mapConnectionRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    provider: row.provider as AccountingProvider,
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
    account_slug:
      (row.fakturoid_account_slug as string | null) ??
      (row.superfaktura_company_id as string | null) ??
      null,
  }
}
