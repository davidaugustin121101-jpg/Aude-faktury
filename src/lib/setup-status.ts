import type { SupabaseClient } from '@supabase/supabase-js'
import { getActiveWorkspace } from '@/lib/workspace'
import { getActiveWorkspaceConnection } from '@/lib/accounting-connection'
import type { SetupStatus } from '@/components/help/SetupChecklist'

export async function getSetupStatus(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  fullName?: string | null
): Promise<SetupStatus> {
  const [{ data: profile }, workspace] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('country_confirmed_at')
      .eq('id', userId)
      .maybeSingle(),
    getActiveWorkspace(supabase, userId, userEmail, fullName),
  ])

  const { data: workspaceRow } = await supabase
    .from('workspaces')
    .select('export_company_ico')
    .eq('id', workspace.id)
    .maybeSingle()

  const { connection } = await getActiveWorkspaceConnection(
    supabase,
    userId,
    userEmail,
    fullName
  )

  return {
    countrySet: !!profile?.country_confirmed_at,
    exportProfileSet: !!workspaceRow?.export_company_ico?.trim(),
    accountingConnected: !!connection,
  }
}
