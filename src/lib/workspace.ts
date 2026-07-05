import type { SupabaseClient } from '@supabase/supabase-js'
import { cache } from 'react'
import type { UserProfileRow } from '@/lib/auth-server'

export type Workspace = {
  id: string
  name: string
  owner_id: string
  created_at: string
}

type WorkspaceProfileHint = Pick<UserProfileRow, 'active_workspace_id' | 'full_name'> | null | undefined

async function resolveActiveWorkspace(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  fullName?: string | null,
  profileHint?: WorkspaceProfileHint
): Promise<Workspace> {
  let profile = profileHint
  if (!profile) {
    const { data } = await supabase
      .from('user_profiles')
      .select('active_workspace_id, full_name')
      .eq('id', userId)
      .single()
    profile = data
  }

  if (profile?.active_workspace_id) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', profile.active_workspace_id)
      .single()
    if (ws) return ws as Workspace
  }

  const { data: existing } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('user_profiles')
      .update({ active_workspace_id: existing.id })
      .eq('id', userId)
    return existing as Workspace
  }

  const name = fullName ?? profile?.full_name ?? userEmail.split('@')[0]
  const { data: created, error } = await supabase
    .from('workspaces')
    .insert({ owner_id: userId, name })
    .select()
    .single()

  if (error || !created) throw new Error('Nepodařilo se vytvořit workspace.')

  await supabase
    .from('user_profiles')
    .update({ active_workspace_id: created.id })
    .eq('id', userId)

  return created as Workspace
}

export const getActiveWorkspace = cache(
  async (
    supabase: SupabaseClient,
    userId: string,
    userEmail: string,
    fullName?: string | null,
    profileHint?: WorkspaceProfileHint
  ): Promise<Workspace> => resolveActiveWorkspace(supabase, userId, userEmail, fullName, profileHint)
)

export async function listWorkspaces(
  supabase: SupabaseClient,
  userId: string
): Promise<Workspace[]> {
  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)
    .order('name')
  return (data ?? []) as Workspace[]
}

export async function createClientWorkspace(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ owner_id: userId, name: name.trim() })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Vytvoření klienta selhalo.')
  return data as Workspace
}

export async function switchWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<void> {
  const { data: ws } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('owner_id', userId)
    .maybeSingle()
  if (!ws) throw new Error('Klient nenalezen.')

  await supabase
    .from('user_profiles')
    .update({ active_workspace_id: workspaceId })
    .eq('id', userId)
}

export async function enableAccountantMode(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase.from('user_profiles').update({ is_accountant: true }).eq('id', userId)
}
