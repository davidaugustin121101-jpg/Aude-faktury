import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { getDashboardContext } from '@/lib/dashboard-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const ctx = await getDashboardContext(supabase, user.id, user.email ?? '')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={user}
        isAccountant={ctx.isAccountant}
        hasActiveSubscription={ctx.hasActiveSubscription}
        accountMode={ctx.accountMode}
        connectedProvider={ctx.connectedProvider}
        workspaceName={ctx.workspaceName}
        invoicesThisMonth={ctx.invoicesThisMonth}
        invoiceLimit={ctx.invoiceLimit}
        invoicesRemaining={ctx.invoicesRemaining}
        totalInvoices={ctx.totalInvoices}
      />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
