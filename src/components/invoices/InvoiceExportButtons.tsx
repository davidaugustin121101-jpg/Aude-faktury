'use client'

import Link from 'next/link'
import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EXPORT_FORMAT_LABELS, type ExportFormat } from '@/lib/export/types'

interface Props {
  invoiceId: string
}

const FORMATS: { format: ExportFormat; recommended?: boolean }[] = [
  { format: 'isdoc', recommended: true },
  { format: 'pohoda', recommended: true },
  { format: 'money_isdoc', recommended: true },
  { format: 'money_native' },
  { format: 'helios_red', recommended: true },
  { format: 'helios_inuvio' },
]

export function InvoiceExportButtons({ invoiceId }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Export souborů</p>
      <p className="text-sm text-gray-600">
        Stáhněte fakturu pro import do Pohody, Money S3 nebo Helios. Pro cloudové systémy (iDoklad,
        Fakturoid, SuperFaktura) použijte tlačítko „Odeslat“ níže. Export nevyužívá AI tokeny.
      </p>
      <div className="flex flex-wrap gap-2">
        {FORMATS.map(({ format, recommended }) => (
          <Link
            key={format}
            href={`/api/invoices/${invoiceId}/export?format=${format}`}
            className={cn(
              buttonVariants({ variant: recommended ? 'default' : 'outline', size: 'sm' })
            )}
            title={EXPORT_FORMAT_LABELS[format]}
          >
            <Download className="h-4 w-4 mr-2" />
            {EXPORT_FORMAT_LABELS[format]}
          </Link>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Při kritickém auditu přidejte{' '}
        <code className="bg-gray-100 px-1 rounded">?force=1</code> k URL, nebo nejdřív opravte
        fakturu.
      </p>
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer font-medium text-gray-600">Jak importovat stažený soubor</summary>
        <ul className="mt-2 space-y-1.5 list-disc pl-4">
          <li>
            <strong>Pohoda XML</strong> — nejdřív vyplňte IČO firmy v Nastavení → Export profil.
            V Pohodě: Datová komunikace → Import XML → vyberte stažený soubor.
          </li>
          <li>
            <strong>Money S3 — ISDOC</strong> (doporučeno) — Agenda Doklady → Import → ISDOC.
          </li>
          <li>
            <strong>Helios Red</strong> — rozbalte ZIP, importujte nejdřív PRIFAK.csv, poté PRIPOL.csv
            (Import z CSV).
          </li>
          <li>
            <strong>ISDOC</strong> — univerzální formát; import podle menu vašeho ERP (Pohoda, Money,
            Helios iNuvio).
          </li>
        </ul>
      </details>
    </div>
  )
}
