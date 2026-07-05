'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink, ArrowRight, BookOpen, Download, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GuideLink } from '@/lib/guides'
import { API_GUIDES, EXPORT_GUIDES } from '@/lib/guides'

function GuideAccordion({ guides, sectionIcon }: { guides: GuideLink[]; sectionIcon: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {guides.map((guide) => {
        const isOpen = openId === guide.id
        return (
          <div key={guide.id} id={guide.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white scroll-mt-24">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={guide.settingsHref}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    Otevřít nastavení v Audeflow
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  {guide.externalUrl && (
                    <a
                      href={guide.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                    >
                      {guide.externalLabel ?? 'Nastavení u poskytovatele'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
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

export function HelpGuidesSection() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Link2 className="h-4 w-4 text-blue-600" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            API napojení (iDoklad, Fakturoid, SuperFaktura)
          </p>
        </div>
        <GuideAccordion guides={API_GUIDES} sectionIcon={<Link2 className="h-3 w-3" />} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Download className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Export souborů (Pohoda, Money, Helios)
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-3 px-1">
          Pohoda, Money S3 a Helios nemají cloudové API pro přijaté faktury — stáhněte soubor z
          detailu faktury a importujte v ERP. Nastavte export profil pro IČO, středisko a typ
          dokladu.
        </p>
        <GuideAccordion guides={EXPORT_GUIDES} sectionIcon={<BookOpen className="h-3 w-3" />} />
      </div>
    </div>
  )
}
