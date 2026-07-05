import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/workspace'
import type { ProcessedInvoice } from '@/types/invoices'
import { InvoiceList } from '@/components/invoices/InvoiceList'
import { InvoiceListFilters } from '@/components/invoices/InvoiceListFilters'
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Upload,
  Coins,
  Receipt,
} from 'lucide-react'
import Link from 'next/link'
import { matchesStatusFilter, type InvoiceStatusFilter } from '@/lib/invoice-status'
import { formatMoney, sumInvoiceAmounts } from '@/lib/invoice-totals'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function FakturyPage({ searchParams }: Props) {
  const { status: statusParam } = await searchParams
  const statusFilter = (['all', 'pending', 'approved', 'error'].includes(statusParam ?? '')
    ? statusParam
    : 'all') as InvoiceStatusFilter

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: allInvoices }, { data: thisMonthRows }] = await Promise.all([
    supabase
      .from('processed_invoices')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('processed_invoices')
      .select('id, castka_celkem, castka_dph, castka_bez_dph, status, mena')
      .eq('user_id', user.id)
      .eq('workspace_id', workspace.id)
      .gte('created_at', firstOfMonth),
  ])

  const invoices = (allInvoices ?? []) as ProcessedInvoice[]
  const filteredInvoices = invoices.filter((inv) => matchesStatusFilter(inv.status, statusFilter))

    (inv) => inv.status === 'needs_manual_check' || inv.status === 'error'
  )

  const monthApproved = sumInvoiceAmounts(thisMonthRows ?? [], { approvedOnly: true })
  const totalThisMonth = thisMonthRows?.length ?? 0
  const sentThisMonth =
    thisMonthRows?.filter((i) =>
      ['sent', 'sent_to_accounting', 'approved'].includes(i.status ?? '')
    ).length ?? 0
  const savedHours = Math.round((sentThisMonth * 5) / 60 * 10) / 10

  const listInvoices = filteredInvoices

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-sm text-gray-500 mt-1">
            Klient: <span className="font-medium text-gray-700">{workspace.name}</span> — přetáhni PDF fakturu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Nastavení
          </Link>
          <Link
            href="/faktury/upload"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Upload className="h-4 w-4" />
            Nahrát fakturu
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          label="Tento měsíc"
          value={String(totalThisMonth)}
          sub="faktur přijato"
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          label="Odesláno"
          value={String(sentThisMonth)}
          sub="tento měsíc"
          color="green"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          label="Vyžaduje kontrolu"
          value={String(needsAttention.length)}
          sub="audit / chyba"
          color="yellow"
        />
        <StatCard
          icon={<Coins className="h-5 w-5 text-emerald-600" />}
          label="Celkem Kč"
          value={formatMoney(monthApproved.total)}
          sub="odeslané tento měsíc"
          color="green"
        />
        <StatCard
          icon={<Receipt className="h-5 w-5 text-violet-600" />}
          label="DPH celkem"
          value={formatMoney(monthApproved.vat)}
          sub="odeslané tento měsíc"
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          label="Ušetřeno"
          value={`~${savedHours} h`}
          sub="práce tento měsíc"
          color="purple"
        />
      </div>

      <Suspense fallback={<div className="h-9" />}>
        <InvoiceListFilters />
      </Suspense>

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          {statusFilter === 'all' ? 'Všechny faktury' : 'Filtrované faktury'}
        </h2>
        <InvoiceList
          invoices={listInvoices}
          emptyMessage="Žádné faktury v tomto filtru"
          compact={statusFilter !== 'all'}
        />
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'blue' | 'green' | 'yellow' | 'purple'
}) {
  const bg = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-amber-50',
    purple: 'bg-purple-50',
  }[color]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
