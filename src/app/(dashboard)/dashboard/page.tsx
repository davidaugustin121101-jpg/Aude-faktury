import {
  Upload,
  Link2,
  CreditCard,
  Zap,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { getDashboardContext } from '@/lib/dashboard-context'
import { requireUser } from '@/lib/auth-server'
import { MODE_LABELS } from '@/lib/account-mode'
import { cn } from '@/lib/utils'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'

const PROVIDER_NAMES = {
  idoklad: 'iDoklad',
  fakturoid: 'Fakturoid',
  superfaktura: 'SuperFaktura',
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()
  const ctx = await getDashboardContext(supabase, user.id, user.email ?? '')

  const { data: recentInvoices } = await supabase
    .from('processed_invoices')
    .select('id, dodavatel_nazev, castka_celkem, status, created_at, ucetni_kod')
    .eq('user_id', user.id)
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })
    .limit(5)

  const isUnlimited = ctx.invoiceLimit >= 999_999
  const usagePercent = isUnlimited
    ? 0
    : Math.min(100, Math.round((ctx.invoicesThisMonth / ctx.invoiceLimit) * 100))

  const isReady = !!ctx.connectedProvider

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Přehled</h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div
          className={cn(
            'rounded-2xl border p-5',
            ctx.hasActiveSubscription
              ? 'bg-violet-50 border-violet-100'
              : 'bg-emerald-50 border-emerald-100'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {ctx.hasActiveSubscription ? (
              <Building2 className="h-4 w-4 text-violet-600" />
            ) : (
              <Zap className="h-4 w-4 text-emerald-600" />
            )}
            <p className="text-sm font-semibold text-gray-900">
              Režim: {MODE_LABELS[ctx.accountMode]}
            </p>
          </div>
          <p className="text-xs text-gray-600">
            {ctx.hasActiveSubscription
              ? ctx.isAccountant
                ? `Klient: ${ctx.workspaceName} · neomezeně faktur`
                : `Tarif aktivní · ${ctx.invoicesThisMonth}/${ctx.invoiceLimit >= 999_999 ? '∞' : ctx.invoiceLimit} faktur`
              : `Solo · ${ctx.invoicesThisMonth}/${ctx.invoiceLimit} faktur tento měsíc`}
          </p>
          {!ctx.hasActiveSubscription && (
            <Link
              href="/settings/predplatne"
              className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline mt-3"
            >
              <CreditCard className="h-3 w-3" />
              Upgradovat tarif · od 299 Kč/měsíc
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900 mb-2">Kredit faktur</p>
          {isUnlimited ? (
            <p className="text-2xl font-bold text-violet-700">Neomezeně</p>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {ctx.invoicesRemaining}
                <span className="text-sm font-normal text-gray-500 ml-1">zbývá</span>
              </p>
              <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {ctx.invoicesThisMonth} z {ctx.invoiceLimit} využito tento měsíc
              </p>
            </>
          )}
        </div>
      </div>

      {!isReady && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-blue-900 mb-1">Připojte fakturační systém (volitelné)</p>
          <p className="text-sm text-blue-700 mb-4">
            {ctx.hasActiveSubscription
              ? `Klient ${ctx.workspaceName} zatím nemá připojený systém.`
              : 'Pro odeslání jedním klikem vyberte iDoklad, Fakturoid nebo SuperFakturu. Export souborů funguje i bez napojení.'}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/settings/accounting"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            >
              <Link2 className="h-4 w-4" />
              Fakturační systém
            </Link>
            <Link
              href="/napoveda"
              className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 hover:bg-blue-100 text-sm font-medium px-4 py-2 rounded-xl"
            >
              Nápověda →
            </Link>
          </div>
        </div>
      )}

      {isReady && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-800">
          Připojeno: <span className="font-semibold">{PROVIDER_NAMES[ctx.connectedProvider!]}</span>
          {ctx.hasActiveSubscription && (
            <span className="text-emerald-600"> · klient {ctx.workspaceName}</span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-600">
          Celkem <span className="font-semibold text-gray-900">{ctx.totalInvoices}</span> faktur ·{' '}
          <Link href="/faktury" className="text-blue-600 hover:underline font-medium">
            Zobrazit statistiky a seznam →
          </Link>
        </p>
        <Link
          href="/faktury/upload"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
        >
          <Upload className="h-4 w-4" />
          Nahrát fakturu
        </Link>
      </div>

      {(recentInvoices?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Poslední faktury</h2>
            <Link href="/faktury" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Zobrazit vše →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {recentInvoices!.map((inv) => (
              <Link key={inv.id} href={`/faktury/${inv.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{inv.dodavatel_nazev ?? 'Neznámý dodavatel'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inv.ucetni_kod && (
                      <span className="font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-2">{inv.ucetni_kod}</span>
                    )}
                    {new Intl.DateTimeFormat('cs-CZ').format(new Date(inv.created_at))}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {inv.castka_celkem != null && (
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(inv.castka_celkem)}
                    </p>
                  )}
                  <InvoiceStatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
