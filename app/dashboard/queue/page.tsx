import { createServerClient } from '@/lib/supabase-server'
import { getActiveWorkspace } from '@/lib/workspace'
import QueuePageClient from '@/components/QueuePageClient'

export default async function QueuePage() {
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
    .select(
      'id, dodavatel_nazev, cislo_faktury, castka_celkem, ucetni_kod, confidence, is_duplicate, ucetni_kod_duvod, created_at'
    )
    .eq('workspace_id', workspace.id)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Fronta faktur</h1>
      <p className="text-gray-500 text-sm mb-6">
        Zkontroluj a hromadně odešli faktury do účetního systému.
      </p>
      <QueuePageClient initialInvoices={invoices ?? []} />
    </div>
  )
}
