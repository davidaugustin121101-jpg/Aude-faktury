import Link from 'next/link'
import { APP_NAME } from '@/lib/brand'
import { LEGAL_LAST_UPDATED } from '@/lib/legal'
import { LegalFooter } from './LegalFooter'
import type { LegalSection } from '@/content/legal/obchodni-podminky'

type Props = {
  title: string
  sections: LegalSection[]
}

export function LegalDocumentLayout({ title, sections }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <span aria-hidden>🧾</span>
            {APP_NAME}
          </Link>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Přihlásit se
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">Poslední aktualizace: {LEGAL_LAST_UPDATED}</p>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-gray-900 mb-3">{section.title}</h2>
              <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <LegalFooter className="mt-12 pt-8 border-t border-gray-200" />
      </main>
    </div>
  )
}
