import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Upload,
  Link2,
  Users,
  CreditCard,
  Zap,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { getDashboardContext } from '@/lib/dashboard-context'
import { MODE_LABELS } from '@/lib/account-mode'
import { cn } from '@/lib/utils'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'

const PROVIDER_NAMES = {
  idoklad: 'iDoklad',
  fakturoid: 'Fakturoid',
  superfaktura: 'SuperFaktura',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getDashboardContext(supabase, user.id, user.email ?? '')

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: thisMonth }, { data: recentInvoices }] = await Promise.all([
    supabase
      .from('processed_invoices')
      .select('id, castka_celkem, status')
      .eq('user_id', user.id)
      .gte('created_at', firstOfMonth),
    supabase
      .from('processed_invoices')
      .select('id, dodavatel_nazev, castka_celkem, status, created_at, ucetni_kod')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalThisMonth = thisMonth?.length ?? 0
  const sentThisMonth = thisMonth?.filter((i) => i.status === 'sent_to_accounting').length ?? 0
  const savedHours = Math.round(((sentThisMonth * 7) / 60) * 10) / 10
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

      {/* Režim + předplatné */}
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
          <p className="text-sm font-semibold text-blue-900 mb-1">Připojte fakturační systém</p>
          <p className="text-sm text-blue-700 mb-4">
            {ctx.hasActiveSubscription
              ? `Klient ${ctx.workspaceName} zatím nemá připojený systém.`
              : 'Vyberte jeden fakturační systém pro váš účet.'}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/settings/accounting"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            >
              <Link2 className="h-4 w-4" />
              Vybrat fakturační systém
            </Link>
            <Link
              href="/faktury/upload"
              className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 hover:bg-blue-100 text-sm font-medium px-4 py-2 rounded-xl"
            >
              Nahrát fakturu →
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="h-5 w-5 text-blue-600" />} label="Celkem faktur" value={String(ctx.totalInvoices)} sub="za celou dobu" color="blue" />
        <StatCard icon={<FileText className="h-5 w-5 text-indigo-600" />} label="Tento měsíc" value={String(totalThisMonth)} sub="nahráno" color="blue" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} label="Odesláno" value={String(ctx.sentTotal)} sub="do účetnictví" color="green" />
        <StatCard icon={<Clock className="h-5 w-5 text-yellow-600" />} label="Kontrola" value={String(ctx.attentionTotal)} sub="audit / chyba" color="yellow" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={<TrendingUp className="h-5 w-5 text-purple-600" />} label="Ušetřeno" value={`~${savedHours} h`} sub="tento měsíc" color="purple" />
        <Link href="/faktury/upload" className="flex items-center gap-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-2xl p-5 transition-all group sm:col-span-2">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200">
            <Upload className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Nahrát fakturu</p>
            <p className="text-xs text-gray-500 mt-0.5">PDF drag & drop → vytěžení faktury</p>
          </div>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/settings/predplatne" className="flex items-center gap-4 bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 rounded-2xl p-5 transition-all group">
          <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200">
            <CreditCard className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Předplatné</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {ctx.hasActiveSubscription ? 'Spravovat předplatné' : 'Upgrade · od 299 Kč/měsíc'}
            </p>
          </div>
        </Link>
        <Link
          href={ctx.hasActiveSubscription ? '/klienti' : '/settings/predplatne'}
          className="flex items-center gap-4 bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 rounded-2xl p-5 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200">
            <Users className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {ctx.hasActiveSubscription ? 'Správa klientů' : 'Účetní režim'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {ctx.hasActiveSubscription ? 'Přepnout klienta' : 'Více firem · 299 Kč/měs'}
            </p>
          </div>
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

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: 'blue' | 'green' | 'yellow' | 'purple' }) {
  const bg = { blue: 'bg-blue-50', green: 'bg-green-50', yellow: 'bg-yellow-50', purple: 'bg-purple-50' }[color]
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
