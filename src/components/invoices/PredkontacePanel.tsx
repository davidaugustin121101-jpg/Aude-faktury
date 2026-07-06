import type { Predkontace } from '@/lib/predkontace'

interface Props {
  predkontace: Predkontace
  mena?: string | null
}

function formatLineAmount(amount: number, mena: string): string {
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: mena || 'CZK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${mena || 'CZK'}`
  }
}

export function PredkontacePanel({ predkontace, mena = 'CZK' }: Props) {
  const currency = (mena ?? 'CZK').toUpperCase()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {predkontace.lines.map((line) => (
          <span
            key={`${line.side}-${line.account}`}
            className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-800 font-mono text-sm px-2.5 py-1 rounded-lg border border-slate-200"
          >
            <span className="text-[10px] font-sans font-semibold uppercase text-slate-500">
              {line.side === 'md' ? 'MD' : 'Dal'}
            </span>
            {line.account}
          </span>
        ))}
      </div>

      <div className="rounded-lg border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Strana</th>
              <th className="px-3 py-2 font-medium">Účet</th>
              <th className="px-3 py-2 font-medium">Popis</th>
              <th className="px-3 py-2 font-medium text-right">Částka</th>
            </tr>
          </thead>
          <tbody>
            {predkontace.lines.map((line) => (
              <tr key={`${line.side}-${line.account}-row`} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-slate-600">
                  {line.side === 'md' ? 'MD' : 'Dal'}
                </td>
                <td className="px-3 py-2 font-mono font-semibold text-slate-900">{line.account}</td>
                <td className="px-3 py-2 text-slate-600">{line.label}</td>
                <td className="px-3 py-2 text-right font-medium text-slate-900">
                  {formatLineAmount(line.amount, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Účet nákladu navrhuje AI. Účty DPH ({predkontace.dph ?? '—'}) a dodavatele (
        {predkontace.dodavatel}) jsou doplněny podle standardní předkontace přijaté faktury.
      </p>
    </div>
  )
}
