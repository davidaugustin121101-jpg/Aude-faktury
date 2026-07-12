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
import {
  countCreditUsageFromLedger,
  countMonthlyUsageFromLedger,
} from '@/lib/invoice-allowance'
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
  creditsConsumed: number
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
  const invoicesExtractedThisMonth = await countMonthlyUsageFromLedger(userId)
  const creditsConsumed = hasActiveProSubscription(profile)
    ? 0
    : await countCreditUsageFromLedger(userId)

  const totalCount = rows.length
  const sentCount = rows.filter((r) => r.status === 'sent_to_accounting').length
  const attentionCount = rows.filter((r) =>
    r.status === 'needs_manual_check' || r.status === 'error'
  ).length

  const conn = connRows?.[0] ?? null
  const hasActiveSub = hasActiveBaseSubscription(profile)
  const invoiceLimit = getInvoiceLimit(profile)
  const invoicesRemaining = getInvoicesRemaining(profile, invoicesExtractedThisMonth)

  end()
  return {
    isAccountant: hasActiveAccountantSubscription(profile),
    hasActiveSubscription: hasActiveSub,
    accountMode: getAccountMode(profile),
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    connectedProvider: (conn?.provider as AccountingProvider) ?? null,
    invoicesThisMonth: invoicesExtractedThisMonth,
    invoiceLimit,
    invoicesRemaining,
    creditsConsumed,
    totalInvoices: totalCount,
    sentTotal: sentCount,
    attentionTotal: attentionCount,
  }
}

export const getDashboardContext = cache(
  async (supabase: SupabaseClient, userId: string, userEmail: string) =>
    loadDashboardContext(supabase, userId, userEmail)
)
