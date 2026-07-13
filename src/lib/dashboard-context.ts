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

  const invoiceBase = () =>
    supabase
      .from('processed_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('workspace_id', workspace.id)

  const [
    { data: connRows },
    { count: totalCount },
    { count: sentCount },
    { count: attentionCount },
    invoicesExtractedThisMonth,
    creditsConsumed,
  ] = await Promise.all([
    supabase
      .from('accounting_connections')
      .select('provider')
      .eq('user_id', userId)
      .eq('workspace_id', workspace.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1),
    invoiceBase(),
    invoiceBase().eq('status', 'sent_to_accounting'),
    invoiceBase().in('status', ['needs_manual_check', 'error']),
    countMonthlyUsageFromLedger(userId),
    hasActiveProSubscription(profile)
      ? Promise.resolve(0)
      : countCreditUsageFromLedger(userId),
  ])

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
    totalInvoices: totalCount ?? 0,
    sentTotal: sentCount ?? 0,
    attentionTotal: attentionCount ?? 0,
  }
}

export const getDashboardContext = cache(
  async (supabase: SupabaseClient, userId: string, userEmail: string) =>
    loadDashboardContext(supabase, userId, userEmail)
)
