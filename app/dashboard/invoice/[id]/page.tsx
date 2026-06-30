import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import InvoicePreview from '@/components/InvoicePreview'

export default async function InvoicePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) redirect('/dashboard')

  return (
    <div className="py-10 px-4">
      <InvoicePreview invoice={invoice} />
    </div>
  )
}
