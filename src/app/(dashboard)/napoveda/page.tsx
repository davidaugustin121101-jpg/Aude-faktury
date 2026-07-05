import Link from 'next/link'
import { Upload, Search, Send, AlertTriangle } from 'lucide-react'
import { requireUser } from '@/lib/auth-server'
import { SetupChecklist } from '@/components/help/SetupChecklist'
import { HelpGuidesSection } from '@/components/help/HelpGuidesSection'
import { getSetupStatus } from '@/lib/setup-status'
import { COMMON_ISSUES, PRE_SEND_CHECKLIST } from '@/lib/guides'

const STEPS = [
  {
    icon: Upload,
    title: '1. Nahrajte PDF faktury',
    text: 'Přetáhněte soubor na stránce Nahrát nebo ve Fakturách.',
    href: '/faktury/upload',
  },
  {
    icon: Search,
    title: '2. Zkontrolujte vytěžené údaje',
    text: 'Projděte IČO, částky, DPH a účetní kód. AI může občas něco přehlédnout.',
    href: '/faktury',
  },
  {
    icon: Send,
    title: '3. Exportujte nebo odešlete',
    text: 'Stáhněte ISDOC/Pohoda XML nebo odešlete do napojeného fakturačního systému.',
    href: '/settings/accounting',
  },
]

export default async function NapovedaPage() {
  const { supabase, user } = await requireUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const setupStatus = await getSetupStatus(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nápověda</h1>
        <p className="text-sm text-gray-500 mt-1">
          Všechny návody na jednom místě — kam kliknout a co zkontrolovat.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-blue-900 mb-4">Začínáme ve 3 krocích</p>
        <div className="space-y-3">
          {STEPS.map(({ icon: Icon, title, text, href }) => (
            <Link
              key={title}
              href={href}
              className="flex items-start gap-3 bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-200 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <SetupChecklist status={setupStatus} showHelpLink={false} />

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900">
          Vždy zkontrolujte vytěžené údaje před exportem nebo odesláním do účetnictví.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Co zkontrolovat před odesláním
        </p>
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {PRE_SEND_CHECKLIST.map((item) => (
            <li key={item} className="px-4 py-3 text-sm text-gray-700 flex items-start gap-2">
              <span className="text-emerald-500 shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <HelpGuidesSection />

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Časté problémy
        </p>
        <div className="space-y-2">
          {COMMON_ISSUES.map((issue) => (
            <div key={issue.title} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{issue.title}</p>
              <p className="text-xs text-gray-600 mt-1">{issue.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
