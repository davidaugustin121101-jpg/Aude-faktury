import { createServerClient } from '@/lib/supabase-server'
import InvoiceList from '@/components/InvoiceList'
import { getActiveWorkspace } from '@/lib/workspace'

export default async function HistoryPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const workspace = await getActiveWorkspace(
    supabase,
    user!.id,
    user!.email ?? '',
    profile?.full_name
  )

  const { data: invoices } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Historie faktur</h1>
      <p className="text-gray-500 text-sm mb-6">Všechny zpracované faktury pro aktivního klienta</p>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <InvoiceList invoices={invoices ?? []} />
      </div>
    </div>
  )
}
