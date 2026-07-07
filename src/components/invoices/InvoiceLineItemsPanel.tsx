import type { FakturaPolozka } from '@/lib/claude'
import { buildSplitPredkontaceFromExtracted } from '@/lib/polozky-predkontace'
import type { ExtractedInvoiceData } from '@/lib/claude'
import { PredkontacePanel } from '@/components/invoices/PredkontacePanel'

interface Props {
  rawExtraction: Record<string, unknown> | null
  mena?: string | null
}

export function InvoiceLineItemsPanel({ rawExtraction, mena }: Props) {
  const data = rawExtraction as Partial<ExtractedInvoiceData> | null
  const polozky = (data?.polozky ?? []) as FakturaPolozka[]

  if (polozky.length === 0) return null

  const split = buildSplitPredkontaceFromExtracted(
    {
      ...(data as ExtractedInvoiceData),
      polozky,
    },
    Boolean(data?.je_prenesena_dan)
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">Položky faktury</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Rozpoložkování z PDF — {polozky.length} položek
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2 font-medium">Název</th>
              <th className="px-4 py-2 font-medium">Typ</th>
              <th className="px-4 py-2 font-medium text-right">Množství</th>
              <th className="px-4 py-2 font-medium text-right">Cena</th>
              <th className="px-4 py-2 font-medium text-right">DPH %</th>
              <th className="px-4 py-2 font-medium">Účet</th>
            </tr>
          </thead>
          <tbody>
            {polozky.map((p, i) => (
              <tr key={`${p.nazev}-${i}`} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-900">{p.nazev}</td>
                <td className="px-4 py-2 text-gray-600 capitalize">{p.typ}</td>
                <td className="px-4 py-2 text-right text-gray-700">{p.mnozstvi}</td>
                <td className="px-4 py-2 text-right text-gray-700">
                  {p.jednotkova_cena.toLocaleString('cs-CZ')}
                </td>
                <td className="px-4 py-2 text-right text-gray-700">{p.sazba_dph} %</td>
                <td className="px-4 py-2 font-mono text-gray-800">{p.ucetni_kod ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {split && split.length > 1 && (
        <div className="border-t border-gray-100 p-5 space-y-4 bg-slate-50/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Rozdělená předkontace (smíšené položky)
          </p>
          {split.map((group) => (
            <div key={group.ucetniKod} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-2 truncate">{group.label}</p>
              <PredkontacePanel predkontace={group.predkontace} mena={mena} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
