import type { SupabaseClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { getActiveWorkspace } from '@/lib/workspace'
import { getUserProfile } from '@/lib/auth-server'
import { perfStart } from '@/lib/server-timing'
import {
  getAccountMode,
  getInvoiceLimit,
  getInvoicesRemaining,
  hasActiveBaseSubscription,
  hasActiveAccountantSubscription,
  type AccountMode,
} from '@/lib/account-mode'
import type { AccountingProvider } from '@/lib/accounting-connection'

export type DashboardContext = {
  isAccountant: boolean
  hasActiveSubscription: boolean
  accountMode: AccountMode
  workspaceId: string
  workspaceName: string
  connectedProvider: AccountingProvider | null
  invoicesThisMonth: number
  invoiceLimit: number
  invoicesRemaining: number
  totalInvoices: number
  sentTotal: number
  attentionTotal: number
}

async function loadDashboardContext(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
): Promise<DashboardContext> {
  const end = perfStart('getDashboardContext')
  const profile = await getUserProfile(userId)

  const workspace = await getActiveWorkspace(
    supabase,
    userId,
    userEmail,
    profile?.full_name,
    profile
  )

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [{ data: connRows }, { data: invoiceRows }] = await Promise.all([
    supabase
      .from('accounting_connections')
      .select('provider')
      .eq('user_id', userId)
      .eq('workspace_id', workspace.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('processed_invoices')
      .select('status, created_at')
      .eq('user_id', userId)
      .eq('workspace_id', workspace.id),
  ])

  const rows = invoiceRows ?? []
  const invoicesThisMonth = rows.filter((r) => r.created_at >= firstOfMonth).length
  const totalCount = rows.length
  const sentCount = rows.filter((r) => r.status === 'sent_to_accounting').length
  const attentionCount = rows.filter((r) =>
    r.status === 'needs_manual_check' || r.status === 'error'
  ).length

  const conn = connRows?.[0] ?? null
  const hasActiveSub = hasActiveBaseSubscription(profile)
  const invoiceLimit = getInvoiceLimit(profile)
  const invoicesRemaining = getInvoicesRemaining(profile, invoicesThisMonth)

  end()
  return {
    isAccountant: hasActiveAccountantSubscription(profile),
    hasActiveSubscription: hasActiveSub,
    accountMode: getAccountMode(profile),
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    connectedProvider: (conn?.provider as AccountingProvider) ?? null,
    invoicesThisMonth,
    invoiceLimit,
    invoicesRemaining,
    totalInvoices: totalCount,
    sentTotal: sentCount,
    attentionTotal: attentionCount,
  }
}

export const getDashboardContext = cache(
  async (supabase: SupabaseClient, userId: string, userEmail: string) =>
    loadDashboardContext(supabase, userId, userEmail)
)
