import { Suspense } from 'react'
import { getActiveWorkspace } from '@/lib/workspace'
import { requireUser, getUserProfile } from '@/lib/auth-server'
import { INVOICE_LIST_SELECT } from '@/lib/invoice-list-columns'
import type { ProcessedInvoice } from '@/types/invoices'
import { InvoiceList } from '@/components/invoices/InvoiceList'
import { InvoiceListFilters } from '@/components/invoices/InvoiceListFilters'
import { InvoicePagination } from '@/components/invoices/InvoicePagination'
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
import { type InvoiceStatusFilter, statusesForFilter } from '@/lib/invoice-status'
import { formatMoney, sumInvoiceAmounts } from '@/lib/invoice-totals'
import { estimateSavedHours } from '@/lib/stats'
import { INVOICE_PAGE_SIZE } from '@/lib/invoice-guards'
import { perfStart } from '@/lib/server-timing'

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function FakturyPage({ searchParams }: Props) {
  const endPage = perfStart('faktury/page')
  const { status: statusParam, page: pageParam } = await searchParams
  const statusFilter = (['all', 'pending', 'approved', 'error', 'rejected'].includes(statusParam ?? '')
    ? statusParam
    : 'all') as InvoiceStatusFilter
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const { supabase, user } = await requireUser()
  const profile = await getUserProfile(user.id)

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name,
    profile
  )

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const from = (page - 1) * INVOICE_PAGE_SIZE
  const to = from + INVOICE_PAGE_SIZE - 1

  const statusValues = statusesForFilter(statusFilter)

  let listQuery = supabase
    .from('processed_invoices')
    .select(INVOICE_LIST_SELECT, { count: 'exact' })
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  if (statusValues) {
    listQuery = listQuery.in('status', statusValues)
  }

  const { data: invoiceRows, count: filteredCount } = await listQuery.range(from, to)

  const { data: monthRows } = await supabase
    .from('processed_invoices')
    .select('castka_celkem, castka_dph, status')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .gte('created_at', firstOfMonth)

  const { count: attentionCount } = await supabase
    .from('processed_invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .in('status', ['needs_manual_check', 'error'])

  const invoices = (invoiceRows ?? []) as ProcessedInvoice[]
  const thisMonthRows = monthRows ?? []
  const monthApproved = sumInvoiceAmounts(thisMonthRows as ProcessedInvoice[], { approvedOnly: true })
  const totalThisMonth = thisMonthRows.length
  const sentThisMonth = thisMonthRows.filter((i) =>
    ['sent', 'sent_to_accounting', 'approved'].includes(i.status ?? '')
  ).length
  const savedHours = estimateSavedHours(sentThisMonth)
  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / INVOICE_PAGE_SIZE))

  endPage()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-sm text-gray-500 mt-1">
            Klient: <span className="font-medium text-gray-700">{workspace.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/settings"
            className="text-sm text-gray-500 hover:text-gray-700 font-medium px-2 py-2"
          >
            Nastavení
          </Link>
          <Link
            href="/faktury/upload"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-1 sm:flex-none"
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
          value={String(attentionCount ?? 0)}
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
          {filteredCount != null && (
            <span className="text-sm font-normal text-gray-500 ml-2">({filteredCount})</span>
          )}
        </h2>
        <InvoiceList
          invoices={invoices}
          emptyMessage="Žádné faktury v tomto filtru"
          compact={statusFilter !== 'all'}
        />
        <InvoicePagination page={page} totalPages={totalPages} statusFilter={statusFilter} />
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
