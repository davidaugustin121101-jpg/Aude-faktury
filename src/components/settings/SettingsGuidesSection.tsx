'use client'

import { useState } from 'react'
import { ChevronDown, BookOpen, Download, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Guide = {
  id: string
  title: string
  icon: React.ReactNode
  summary: string
  steps: string[]
  note?: string
}

const API_GUIDES: Guide[] = [
  {
    id: 'idoklad',
    title: 'iDoklad — API přístup',
    icon: '🧾',
    summary: 'Cloud fakturace pro ČR. Odesílání faktur přímo přes REST API.',
    steps: [
      'Přihlaste se do iDoklad → Nastavení → Aplikace a služby → Moje aplikace.',
      'Vytvořte novou aplikaci (OAuth2) a získejte Client ID a Client Secret.',
      'Alternativa: v iDoklad → Nastavení → API vygenerujte Bearer token (jednodušší, ale méně bezpečné).',
      'V Audeflow → Nastavení → Fakturační systém vyberte iDoklad a vložte údaje.',
      'Po nahrání faktury klikněte „Odeslat do iDoklad“ na detailu faktury.',
    ],
    note: 'iDoklad vyžaduje placený tarif s API přístupem.',
  },
  {
    id: 'fakturoid',
    title: 'Fakturoid — API přístup',
    icon: '📊',
    summary: 'Oblíbený u OSVČ a malých firem v ČR.',
    steps: [
      'Fakturoid → Nastavení → Uživatelský účet → API → Nová integrace.',
      'Zadejte název (např. Audeflow) a zkopírujte Client ID + Client Secret.',
      'Ve Fakturoidu musíte mít placený tarif — free tarif neumožňuje vytvářet náklady přes API.',
      'V Audeflow vyberte Fakturoid a vložte Client ID a Secret.',
    ],
    note: 'Slug účtu najdete v URL: fakturoid.cz/a/VAS-SLUG/…',
  },
  {
    id: 'superfaktura',
    title: 'SuperFaktura / SuperFaktúra — API',
    icon: '📋',
    summary: 'Funguje pro ČR i SK. Odesílání přijatých faktur přes API.',
    steps: [
      'SuperFaktura → Nástroje → API přístup → vytvořte API uživatele s rolí Administrátor.',
      'Zkopírujte email API účtu a API klíč.',
      'Ve SuperFaktuře musí být kompletně vyplněný firemní profil (IČO, adresa, DIČ).',
      'Company ID je volitelné — vyplňte jen pokud máte více firem pod jedním účtem.',
      'V Audeflow vyberte SuperFaktura a zadejte email + klíč.',
    ],
  },
]

const EXPORT_GUIDES: Guide[] = [
  {
    id: 'isdoc',
    title: 'ISDOC — univerzální formát',
    icon: '📄',
    summary: 'Standardní český/slovenský formát elektronické faktury.',
    steps: [
      'Na detailu faktury klikněte „ISDOC (univerzální)“.',
      'Importujte soubor v Pohodě, Money S3, Helios nebo jiném ERP s podporou ISDOC.',
      'Export nevyužívá AI tokeny — můžete stahovat neomezeně.',
    ],
  },
  {
    id: 'pohoda',
    title: 'Pohoda — XML import',
    icon: '🟢',
    summary: 'Nativní XML pro Stormware Pohoda.',
    steps: [
      'Nastavte export profil: IČO vaší firmy (dataPack) v Nastavení → Export profil.',
      'Stáhněte „Pohoda XML“ z detailu faktury.',
      'V Pohodě: Soubor → Import → XML datové sady → vyberte stažený soubor.',
    ],
  },
  {
    id: 'money',
    title: 'Money S3',
    icon: '💰',
    summary: 'Dva formáty — ISDOC (doporučeno) nebo nativní XML.',
    steps: [
      'Doporučujeme „Money S3 — ISDOC“ — spolehlivější než nativní XML.',
      'V Money: Agenda Doklady → Import → ISDOC.',
      'Typ dokladu nastavte v export profilu (výchozí FP = faktura přijatá).',
    ],
    note: 'Nativní Money XML je best-effort bez XSD validace.',
  },
  {
    id: 'helios',
    title: 'Helios Red / iNuvio',
    icon: '🔴',
    summary: 'CSV/ZIP pro Helios Red nebo XML pro Helios iNuvio.',
    steps: [
      'Helios Red: stáhněte ZIP s CSV soubory → import v Helios Red.',
      'Helios iNuvio: stáhněte XML → import dle dokumentace iNuvio.',
      'Středisko a zakázku nastavte v export profilu (STRED / STRED2).',
      'Helios Red podporuje pouze CZK faktury.',
    ],
  },
]

function GuideAccordion({ guides, sectionIcon }: { guides: Guide[]; sectionIcon: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {guides.map((guide) => {
        const isOpen = openId === guide.id
        return (
          <div key={guide.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : guide.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg shrink-0">{guide.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{guide.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{guide.summary}</p>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-400 shrink-0 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-gray-700">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
                {guide.note && (
                  <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {guide.note}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
      <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1 pt-1">
        {sectionIcon}
        Potřebujete pomoc?{' '}
        <a href="mailto:podpora@audeflow.cz" className="underline">
          podpora@audeflow.cz
        </a>
      </p>
    </div>
  )
}

export function SettingsGuidesSection() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Link2 className="h-4 w-4 text-blue-600" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Návody — API napojení
          </p>
        </div>
        <GuideAccordion guides={API_GUIDES} sectionIcon={<Link2 className="h-3 w-3" />} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Download className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Návody — export souborů (Pohoda, Money, Helios)
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-3 px-1">
          Pohoda, Money S3 a Helios nemají cloudové API pro přijaté faktury — stáhněte soubor z
          detailu faktury a importujte v ERP. Nastavte export profil výše pro IČO, středisko a typ
          dokladu.
        </p>
        <GuideAccordion guides={EXPORT_GUIDES} sectionIcon={<BookOpen className="h-3 w-3" />} />
      </div>
    </div>
  )
}
