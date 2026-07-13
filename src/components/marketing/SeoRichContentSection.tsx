import {
  API_ACCOUNTING_SYSTEMS,
  ERP_EXPORT_SYSTEMS,
  EXTRACTION_FEATURES,
  PRICING_SEO,
} from '@/content/marketing/seo-systems'
import { SEO_LANDING_PAGES } from '@/content/marketing/seo-landing-pages'
import { APP_NAME } from '@/lib/brand'
import Link from 'next/link'

export function SeoRichContentSection() {
  return (
    <section className="py-16 sm:py-20 bg-white border-t border-gray-100" aria-labelledby="seo-overview">
      <div className="max-w-4xl mx-auto px-4 prose prose-gray prose-sm sm:prose-base">
        <p id="seo-overview" className="text-xs font-bold uppercase tracking-wider text-blue-600 not-prose mb-2">
          Proč Audeflow
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 not-prose mb-4">
          Vytěžení PDF faktur a export do účetnictví — {PRICING_SEO.headline}
        </h2>
        <p className="text-gray-600 leading-relaxed not-prose mb-10">
          {APP_NAME} automaticky vytěží přijatou fakturu z PDF, navrhne českou předkontaci a odešle ji
          do vašeho fakturačního nebo účetního systému. {PRICING_SEO.text}
        </p>

        <h3 className="text-xl font-bold text-gray-900 not-prose mt-10 mb-4">
          Co náš vytěžovací systém umí
        </h3>
        <ul className="space-y-4 not-prose list-none p-0 m-0">
          {EXTRACTION_FEATURES.map((f) => (
            <li key={f.title} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              <h4 className="font-semibold text-gray-900 mb-1">{f.title}</h4>
              <p className="text-sm text-gray-600 m-0">{f.text}</p>
            </li>
          ))}
        </ul>

        <h3 className="text-xl font-bold text-gray-900 not-prose mt-12 mb-4">
          Napojení přes API — cloudové fakturační systémy
        </h3>
        <div className="space-y-4 not-prose">
          {API_ACCOUNTING_SYSTEMS.map((s) => (
            <article key={s.id} id={`integrace-${s.slug}`}>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                Vytěžení faktury a odeslání do {s.name}
              </h4>
              <p className="text-sm text-gray-600 m-0">{s.description}</p>
            </article>
          ))}
        </div>

        <h3 className="text-xl font-bold text-gray-900 not-prose mt-12 mb-4">
          Export do účetních systémů Pohoda, Money S3 a Helios
        </h3>
        <div className="space-y-4 not-prose">
          {ERP_EXPORT_SYSTEMS.map((s) => (
            <article key={s.id} id={`export-${s.slug}`}>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                Export faktury do {s.name}
              </h4>
              <p className="text-sm text-gray-600 m-0">{s.description}</p>
            </article>
          ))}
        </div>

        <h3 className="text-xl font-bold text-gray-900 not-prose mt-12 mb-3">
          Ceník — od {PRICING_SEO.perInvoice} za fakturu
        </h3>
        <p className="text-gray-600 not-prose">
          {PRICING_SEO.free}. Balíček Standard {PRICING_SEO.pack} — jedna z nejnižších cen automatického
          vytěžení a exportu faktur na českém trhu. Bez skrytých poplatků, kredit neexpiruje.
        </p>

        <h3 className="text-xl font-bold text-gray-900 not-prose mt-12 mb-4">
          Srovnání s dalšími řešeními na českém trhu
        </h3>
        <p className="text-gray-600 not-prose mb-4">
          Na trhu existují služby jako Čtení faktur (ctenifaktur.cz), Digitoo, Flowis nebo vestavěné
          OCR ve Fakturoidu. {APP_NAME} se odlišuje kombinací nejnižší ceny za doklad (od 2,99 Kč),
          napojením na více cloudových systémů najednou a exportem do desktopových ERP — Pohoda, Money
          S3 a Helios. Pro účetní kanceláře nabízíme modul více klientů s přepínáním workspaces.
        </p>
        <p className="text-gray-600 not-prose mb-4">
          Na rozdíl od čistého OCR vracíme strukturovaná data včetně návrhu předkontace MD/DAL,
          kontroly duplicit a ověření IČO v ARES — ne jen text z PDF. Podrobné srovnání najdete na
          stránce{' '}
          <Link href="/alternativa-ctenifaktur" className="text-blue-600 hover:underline">
            alternativa pro vytěžení faktur
          </Link>
          .
        </p>

        <h3 className="text-xl font-bold text-gray-900 not-prose mt-12 mb-4">
          Průvodce vytěžením faktur — podrobné stránky
        </h3>
        <nav aria-label="SEO průvodce" className="not-prose">
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {SEO_LANDING_PAGES.map((page) => (
              <li key={page.slug}>
                <Link href={`/${page.slug}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                  {page.h1}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}
