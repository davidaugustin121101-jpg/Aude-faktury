import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SettingsNav } from '@/components/settings/SettingsNav'
import type { AccountingConnection } from '@/types/invoices'
import { AccountingConnectionManager } from './AccountingConnectionManager'
import { hasActiveAccountantSubscription } from '@/lib/account-mode'
import type { CountryCode } from '@/lib/accounting-codes'
import { getActiveWorkspace } from '@/lib/workspace'
import { mapConnectionRow } from '@/lib/accounting-connection'
import { BookOpen } from 'lucide-react'

export default async function AccountingSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('country, full_name, is_accountant, stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  const { data: connections } = await supabase
    .from('accounting_connections')
    .select(
      'id, user_id, provider, country, is_active, created_at, fakturoid_account_slug, superfaktura_company_id'
    )
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const country = ((profile as { country?: string } | null)?.country ?? 'cz') as CountryCode

  const mapped = (connections ?? []).map((c) =>
    mapConnectionRow(c as Record<string, unknown>)
  ) as AccountingConnection[]

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fakturační systém</h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasActiveAccountantSubscription(profile)
              ? `Vyberte jeden systém pro klienta ${workspace.name}.`
              : 'Vyberte jeden fakturační systém pro váš účet — iDoklad, Fakturoid nebo SuperFaktura.'}
          </p>
        </div>
        <SettingsNav />
      </div>

      <Link
        href="/napoveda"
        className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-900 hover:bg-blue-100 transition-colors"
      >
        <BookOpen className="h-4 w-4 shrink-0" />
        <span>
          Podrobný návod k napojení API →{' '}
          <span className="font-semibold">Nápověda</span>
        </span>
      </Link>

      <AccountingConnectionManager
        connections={mapped}
        userCountry={country}
        isAccountant={hasActiveAccountantSubscription(profile)}
        workspaceName={workspace.name}
      />
    </div>
  )
}
