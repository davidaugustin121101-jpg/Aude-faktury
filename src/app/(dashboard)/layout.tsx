import { Sidebar } from '@/components/layout/sidebar'
import { MobileNavProvider } from '@/components/layout/mobile-nav'
import { getDashboardContext } from '@/lib/dashboard-context'
import { requireUser } from '@/lib/auth-server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // #region agent log
  fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',hypothesisId:'H1',location:'(dashboard)/layout.tsx:entry',message:'dashboard layout start',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    const { supabase, user } = await requireUser()
    const ctx = await getDashboardContext(supabase, user.id, user.email ?? '')
    // #region agent log
    fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',hypothesisId:'H1',location:'(dashboard)/layout.tsx:ready',message:'dashboard layout context loaded',data:{workspaceId:ctx.workspaceId,accountMode:ctx.accountMode},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'20dbe5'},body:JSON.stringify({sessionId:'20dbe5',hypothesisId:'H1',location:'(dashboard)/layout.tsx:error',message:'dashboard layout failed',data:{error:err instanceof Error?err.message:'unknown'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw err
  }
}
