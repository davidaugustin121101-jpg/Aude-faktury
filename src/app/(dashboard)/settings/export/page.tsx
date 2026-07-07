import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileDown, HelpCircle } from 'lucide-react'
import { requireUser } from '@/lib/auth-server'
import { getDashboardContext } from '@/lib/dashboard-context'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { ExportProfileSettingsSection } from '@/components/settings/ExportProfileSettingsSection'
export default async function ExportSettingsPage() {
  const { supabase, user } = await requireUser()
  const ctx = await getDashboardContext(supabase, user.id, user.email ?? '')

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export profil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Údaje vaší firmy pro stažení faktur do účetního programu.
          </p>
        </div>
        <SettingsNav />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-3 text-sm text-blue-900">
            <p className="font-semibold">Proč export profil vyplnit?</p>
            <p className="text-blue-800">
              Export profil slouží pro <strong>stažení souboru</strong> (ISDOC, Pohoda XML, Money S3,
              Helios), který naimportujete do svého účetního programu. Bez něj export neobsahuje správné
              IČO vaší firmy, středisko ani typ dokladu — účetní pak musí údaje doplnit ručně.
            </p>
            <p className="text-blue-800">
              <strong>Není to totéž jako fakturační systém.</strong> Napojení iDoklad / Fakturoid /
              SuperFaktura slouží k odeslání faktury přímo přes API. Export profil potřebujete jen pokud
              faktury stahujete jako soubor pro Pohodu, Money nebo Helios.
            </p>
          </div>
        </div>

        <div className="border-t border-blue-100 pt-4">
          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-3">
            Kde vzít jednotlivé údaje
          </p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-blue-900">IČO firmy</dt>
              <dd className="text-blue-800 mt-0.5">
                IČO vaší společnosti nebo OSVČ — stejné jako v živnostenském listu / obchodním rejstříku.
                Pohoda ho potřebuje v hlavičce XML souboru (dataPack).
              </dd>
            </div>
            <div>
              <dt className="font-medium text-blue-900">Výchozí účetní kód</dt>
              <dd className="text-blue-800 mt-0.5">
                Účet z vašeho účtového rozvrhu (např. 518 Ostatní služby). Pokud nevíte, nechte prázdné —
                při exportu jednotlivé faktury můžete kód upravit.
              </dd>
            </div>
            <div id="money" className="scroll-mt-24">
              <dt className="font-medium text-blue-900">Money — typ dokladu</dt>
              <dd className="text-blue-800 mt-0.5">
                V Money S3 obvykle <strong>FP</strong> (faktura přijatá). Najdete v Money v číselníku typů
                dokladů nebo se zeptejte účetní.
              </dd>
            </div>
            <div id="helios" className="scroll-mt-24">
              <dt className="font-medium text-blue-900">Helios — středisko a zakázka</dt>
              <dd className="text-blue-800 mt-0.5">
                Kódy z vašeho Heliosu: <strong>STRED</strong> (středisko) a <strong>STRED2</strong> (zakázka).
                Účetní vám je sdělí podle interního členění firmy. Varianta Red = CSV, iNuvio = XML.
              </dd>
            </div>
            <div id="pohoda" className="scroll-mt-24">
              <dt className="font-medium text-blue-900">Země exportu</dt>
              <dd className="text-blue-800 mt-0.5">
                České účetnictví — exporty používají české sazby DPH a formáty.
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
        <FileDown className="h-4 w-4 shrink-0" />
        <span>
          Po vyplnění uložte profil. Export spustíte na detailu konkrétní faktury tlačítkem Stáhnout.
        </span>
      </div>

      <ExportProfileSettingsSection
        workspaceId={ctx.workspaceId}
        workspaceName={ctx.workspaceName}
      />

      <p className="text-xs text-gray-500 px-1">
        Podrobné návody k exportu najdete v{' '}
        <Link href="/napoveda" className="text-blue-600 hover:underline">
          Nápovědě
        </Link>
        . Dotazy pište na{' '}
        <a href="mailto:kontakt@audeflow.cz" className="text-blue-600 hover:underline">
          kontakt@audeflow.cz
        </a>
        .
      </p>
    </div>
  )
}
