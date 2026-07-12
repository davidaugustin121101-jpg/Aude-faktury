import { Sidebar } from '@/components/layout/sidebar'
import { MobileNavProvider } from '@/components/layout/mobile-nav'
import { getDashboardContext } from '@/lib/dashboard-context'
import { requireUser } from '@/lib/auth-server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { supabase, user } = await requireUser()
  const ctx = await getDashboardContext(supabase, user.id, user.email ?? '')

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      <Sidebar
        className="hidden lg:flex"
        user={user}
        isAccountant={ctx.isAccountant}
        hasActiveSubscription={ctx.hasActiveSubscription}
        accountMode={ctx.accountMode}
        connectedProvider={ctx.connectedProvider}
        workspaceName={ctx.workspaceName}
        invoicesThisMonth={ctx.invoicesThisMonth}
        invoiceLimit={ctx.invoiceLimit}
        invoicesRemaining={ctx.invoicesRemaining}
        creditsConsumed={ctx.creditsConsumed}
        totalInvoices={ctx.totalInvoices}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileNavProvider
          userEmail={user.email}
          isAccountant={ctx.isAccountant}
          accountMode={ctx.accountMode}
          connectedProvider={ctx.connectedProvider}
          workspaceName={ctx.workspaceName}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
