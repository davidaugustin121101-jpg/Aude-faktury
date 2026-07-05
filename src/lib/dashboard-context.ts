import type { SupabaseClient } from '@supabase/supabase-js'
import { getActiveWorkspace } from '@/lib/workspace'
import {
  getAccountMode,
  getInvoiceLimit,
  getInvoicesRemaining,
  hasActiveSubscription,
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

export async function getDashboardContext(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
): Promise<DashboardContext> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, invoice_credits, is_accountant, stripe_subscription_id, stripe_addon_subscription_id, full_name')
    .eq('id', userId)
    .maybeSingle()

  const workspace = await getActiveWorkspace(
    supabase,
    userId,
    userEmail,
    profile?.full_name
  )

  const { data: connRows } = await supabase
    .from('accounting_connections')
    .select('provider')
    .eq('user_id', userId)
    .eq('workspace_id', workspace.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)

  const conn = connRows?.[0] ?? null

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: monthCount },
    { count: totalCount },
    { count: sentCount },
    { count: attentionCount },
  ] = await Promise.all([
    supabase
      .from('processed_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', firstOfMonth),
    supabase
      .from('processed_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('processed_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'sent_to_accounting'),
    supabase
      .from('processed_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['needs_manual_check', 'error']),
  ])

  const invoicesThisMonth = monthCount ?? 0
  const hasActiveSub = hasActiveBaseSubscription(profile)
  const invoiceLimit = getInvoiceLimit(profile)
  const invoicesRemaining = getInvoicesRemaining(profile, invoicesThisMonth)

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
    totalInvoices: totalCount ?? 0,
    sentTotal: sentCount ?? 0,
    attentionTotal: attentionCount ?? 0,
  }
}
