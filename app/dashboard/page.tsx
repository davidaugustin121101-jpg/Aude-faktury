import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import PlanBanner from '@/components/PlanBanner'
import InvoiceList from '@/components/InvoiceList'
import { PlanKey } from '@/lib/stripe'
import { getActiveWorkspace } from '@/lib/workspace'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { sent?: string; url?: string; docId?: string }
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, invoices_this_month, full_name')
    .eq('id', user!.id)
    .single()

  const workspace = await getActiveWorkspace(
    supabase,
    user!.id,
    user!.email ?? '',
    profile?.full_name
  )

  const { data: conn } = await supabase
    .from('accounting_connections')
    .select('provider, connection_label')
    .eq('user_id', user!.id)
    .eq('workspace_id', workspace.id)
    .eq('is_active', true)
    .maybeSingle()

  const { data: invoices } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const plan = (profile?.plan ?? 'free') as PlanKey

  return (
    <div className="p-8 max-w-5xl">
      {searchParams.sent === '1' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm space-y-2">
          <p>✓ Faktura byla okamžitě odeslána do iDokladu (API nečeká — je to synchronní).</p>
          {searchParams.docId && (
            <p className="text-green-700 text-xs">ID dokladu v iDokladu: {searchParams.docId}</p>
          )}
          <p className="text-green-700 text-xs">
            V iDokladu ji najdeš v menu <strong>Nákup → Faktury přijaté</strong> (ne v Prodeji).
          </p>
          {searchParams.url && (
            <a
              href={decodeURIComponent(searchParams.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-700 underline text-sm font-medium"
            >
              Otevřít seznam přijatých faktur v iDokladu →
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Ahoj{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Klient: <strong className="text-gray-700">{workspace.name}</strong>
            {conn ? (
              <span className="text-green-600">
                {' '}
                · {conn.provider === 'idoklad' ? 'iDoklad' : 'Fakturoid'}
                {conn.connection_label ? ` (${conn.connection_label})` : ''}
              </span>
            ) : (
              <span className="text-amber-600">
                {' '}
                ·{' '}
                <Link href="/dashboard/settings/accounting" className="underline">
                  chybí fakturační systém
                </Link>
              </span>
            )}
          </p>
        </div>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
        >
          + Nahrát faktury
        </Link>
        <Link
          href="/dashboard/queue"
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl"
        >
          Fronta
        </Link>
      </div>
      </div>

      <div className="mb-6">
        <PlanBanner plan={plan} used={profile?.invoices_this_month ?? 0} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Poslední faktury</h2>
        <InvoiceList invoices={invoices ?? []} />
      </div>
    </div>
  )
}
