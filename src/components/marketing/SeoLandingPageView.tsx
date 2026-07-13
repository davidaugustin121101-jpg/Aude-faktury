import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingHeader } from '@/components/marketing/landing-header'
import { LegalFooter } from '@/components/legal/LegalFooter'
import { APP_NAME } from '@/lib/brand'
import type { SeoLandingPage } from '@/content/marketing/seo-landing-pages'
import { getRelatedSeoPages } from '@/content/marketing/seo-landing-pages'

type Props = {
  page: SeoLandingPage
  isAuthenticated?: boolean
}

export function SeoLandingPageView({ page, isAuthenticated = false }: Props) {
  const related = getRelatedSeoPages(page.relatedSlugs)

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader isAuthenticated={isAuthenticated} />

      <main className="pt-20 sm:pt-24 pb-16">
        <article className="max-w-3xl mx-auto px-4">
          <nav aria-label="Drobečková navigace" className="text-sm text-gray-500 mb-6">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-blue-600">
                  Domů
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-900 font-medium truncate">{page.h1}</li>
            </ol>
          </nav>

          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">{APP_NAME}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">{page.h1}</h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-10">{page.intro}</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-14">
            <Link href={isAuthenticated ? '/faktury/upload' : '/register'}>
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 gap-2">
                {isAuthenticated ? 'Nahrát fakturu' : 'Vyzkoušet zdarma'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Ceník od 2,99 Kč
              </Button>
            </Link>
          </div>

          {page.sections.map((section) => (
            <section key={section.heading} className="mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{section.heading}</h2>
              <p className="text-gray-600 leading-relaxed">{section.body}</p>
            </section>
          ))}

          <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 sm:p-8 mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Proč {APP_NAME}</h2>
            <ul className="space-y-2 text-gray-700">
              {[
                'Vytěžení od 2,99 Kč za fakturu',
                'API do iDokladu, Fakturoidu, SuperFaktury, BitFaktury, Súčta',
                'Export Pohoda XML, Money S3, Helios',
                'Návrh předkontace MD/DAL a účetního kódu',
                'E-mail @in.audeflow.cz a kontrola duplicit',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {related.length > 0 && (
            <section className="border-t border-gray-100 pt-10" aria-labelledby="related-seo">
              <h2 id="related-seo" className="text-lg font-bold text-gray-900 mb-4">
                Související témata
              </h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/${r.slug}`}
                      className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1"
                    >
                      {r.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>

      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <LegalFooter />
        </div>
      </footer>
    </div>
  )
}
