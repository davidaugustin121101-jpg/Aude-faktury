import Link from 'next/link'
import ConfidenceBadge from './ConfidenceBadge'

interface InvoiceRow {
  id: string
  dodavatel_nazev?: string | null
  cislo_faktury?: string | null
  castka_celkem?: number | null
  status: string
  confidence?: number | null
  created_at: string
  ucetni_kod?: string | null
  is_duplicate?: boolean
  accounting_provider?: string | null
  accounting_document_id?: string | null
  accounting_document_url?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Ke kontrole',
  approved: 'Schváleno',
  rejected: 'Zahozeno',
  sent: 'Odesláno',
  error: 'Chyba',
}

export default function InvoiceList({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-8">
        Zatím žádné faktury.{' '}
        <Link href="/dashboard/upload" className="text-blue-600 hover:underline">
          Nahraj první fakturu
        </Link>
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 font-medium">Dodavatel</th>
            <th className="pb-3 font-medium">Číslo</th>
            <th className="pb-3 font-medium">Částka</th>
            <th className="pb-3 font-medium">Účet</th>
            <th className="pb-3 font-medium">Stav</th>
            <th className="pb-3 font-medium">Jistota</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 text-gray-900">
                {inv.dodavatel_nazev ?? '—'}
                {inv.is_duplicate && (
                  <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                    duplicita
                  </span>
                )}
              </td>
              <td className="py-3 text-gray-600">{inv.cislo_faktury ?? '—'}</td>
              <td className="py-3 text-gray-900">
                {inv.castka_celkem != null
                  ? `${Number(inv.castka_celkem).toLocaleString('cs-CZ')} Kč`
                  : '—'}
              </td>
              <td className="py-3 font-mono text-blue-700">{inv.ucetni_kod ?? '—'}</td>
              <td className="py-3">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {STATUS_LABELS[inv.status] ?? inv.status}
                </span>
              </td>
              <td className="py-3">
                {inv.confidence != null && <ConfidenceBadge value={inv.confidence} />}
              </td>
              <td className="py-3">
                <div className="flex flex-col gap-1 items-start">
                  <Link
                    href={`/dashboard/invoice/${inv.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Detail
                  </Link>
                  {inv.status === 'sent' && inv.accounting_document_url && (
                    <a
                      href={inv.accounting_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Otevřít v {inv.accounting_provider === 'fakturoid' ? 'Fakturoidu' : 'iDokladu'}
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
