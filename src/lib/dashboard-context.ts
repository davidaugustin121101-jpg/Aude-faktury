import type { SupabaseClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { getActiveWorkspace } from '@/lib/workspace'
import { getUserProfile } from '@/lib/auth-server'
import { perfStart } from '@/lib/server-timing'
import {
  getAccountMode,
  getInvoiceCredits,
  getInvoiceLimit,
  getInvoicesRemaining,
  hasActiveBaseSubscription,
  hasActiveAccountantSubscription,
  hasActiveProSubscription,
  type AccountMode,
} from '@/lib/account-mode'
import { countMonthlyFreeUsage } from '@/lib/invoice-allowance'
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
  const invoicesCreatedThisMonth = rows.filter((r) => r.created_at >= firstOfMonth).length

  let invoicesThisMonth = invoicesCreatedThisMonth
  if (!hasActiveProSubscription(profile) && getInvoiceCredits(profile) === 0) {
    invoicesThisMonth = await countMonthlyFreeUsage(userId)
  }

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
  // #region agent log
  fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',hypothesisId:'H4',location:'dashboard-context.ts:done',message:'getDashboardContext complete',data:{workspaceId:workspace.id,invoicesThisMonth,invoicesRemaining,totalCount},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
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
