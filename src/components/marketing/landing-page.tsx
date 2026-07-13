import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Sparkles,
  Upload,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BILLING_TIERS, MULTI_CLIENT_ADDON, soloFreeMonthlyLabel, soloFreePerMonthLabel, soloFreeShortLabel } from '@/lib/account-mode'
import { LandingHeader } from '@/components/marketing/landing-header'
import { LandingDropZone } from '@/components/marketing/LandingDropZone'
import { LegalFooter } from '@/components/legal/LegalFooter'
import { APP_NAME, EXTRACTION_LABEL } from '@/lib/brand'
import {
  getLandingPrimaryCtaHref,
  getLandingTierHref,
  getMultiClientAddonHref,
} from '@/lib/landing-links'
import { SupportedSystemsSection } from '@/components/marketing/SupportedSystemsSection'
import { LandingDemoVideoSection } from '@/components/marketing/LandingDemoVideoSection'
import { LandingReviewsSection } from '@/components/marketing/LandingReviewsSection'
import { LandingAboutSection } from '@/components/marketing/LandingAboutSection'
import { SeoRichContentSection } from '@/components/marketing/SeoRichContentSection'
import { MARKETING_FAQ } from '@/content/marketing/faq'
import { getExtractionSpeedClaim } from '@/content/marketing/metrics'

const CLOUD_SYSTEMS =
  'iDoklad, Fakturoid, SuperFaktura, BitFaktura a Súčto'

const STEPS = [
  {
    title: 'Nahrajte PDF fakturu',
    desc: 'Přetáhněte PDF, pošlete na svou adresu @in.audeflow.cz, nebo nahrajte ze skenu v prohlížeči.',
  },
  {
    title: EXTRACTION_LABEL,
    desc: 'Automaticky vytěžíme dodavatele, IČO, částku, DPH a navrhneme český účetní kód.',
  },
  {
    title: 'Audit a kontrola dat',
    desc: 'Systém zkontroluje matematiku, DPH, IČO v ARES a navrhne český účetní kód.',
  },
  {
    title: 'Export nebo odeslání',
    desc: `Stáhněte Pohoda/Money/Helios, nebo odešlete do ${CLOUD_SYSTEMS} včetně PDF přílohy.`,
  },
  {
    title: 'Faktura v účetnictví',
    desc: 'Hotovo — faktura je zaevidovaná v ERP nebo cloudovém fakturačním systému.',
  },
]

export function LandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader isAuthenticated={isAuthenticated} />

      <main className="pt-14 sm:pt-16">
        <section className="max-w-6xl mx-auto px-4 py-12 sm:py-20 lg:py-28 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Automatické zpracování faktur · Česko
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Vytěžení faktury{' '}
              <span className="text-blue-600">od 2,99 Kč.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
              Přetáhněte PDF nebo pošlete e-mailem — Audeflow vytěží data, navrhne předkontaci{' '}
              <strong className="text-gray-800">504/343/321</strong> a odešle do {CLOUD_SYSTEMS}.
              Export do Pohody, Money S3 a Helios.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700">
                  Rychlost
                </p>
                <p className="text-sm font-semibold text-sky-900">{getExtractionSpeedClaim()}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Cena
                </p>
                <p className="text-sm font-semibold text-emerald-900">
                  od 2,99 Kč/faktura · nejnižší cena na trhu
                </p>
                <p className="text-xs text-emerald-800">kredit bez expirace</p>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">
                  Předkontace
                </p>
                <p className="text-sm font-semibold text-violet-900">
                  Rovnou navrhneme účetní zápis
                </p>
                <p className="text-xs text-violet-800">ne jen surová data z faktury</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={getLandingPrimaryCtaHref(isAuthenticated)}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Zkusit zdarma
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline">
                  Ceník
                </Button>
              </a>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Bez karty, výsledek za pár vteřin
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                soloFreeShortLabel(),
                'iDoklad · Fakturoid · SuperFaktura',
                'BitFaktura · Súčto',
                'Pohoda · Money S3 · Helios',
              ].map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

          <LandingDropZone isAuthenticated={isAuthenticated} />
        </section>

        <LandingDemoVideoSection />

        <SupportedSystemsSection />

        <section id="jak-funguje" className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
              Jak to funguje
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Pět kroků. Jednou nastavíte, pak jen klikáte.
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <div key={step.title} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <LandingReviewsSection />

        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 sm:p-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full px-3 py-1 mb-4">
                <User className="h-3.5 w-3.5" />
                Solo — zdarma
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Pro podnikatele a OSVČ</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Jeden účet, jeden fakturační systém dle vašeho výběru ({CLOUD_SYSTEMS}). {soloFreeMonthlyLabel()}.
                Ideální pokud fakturujete sami za sebe.
              </p>
              <ul className="space-y-2 mb-6">
                {BILLING_TIERS[0].benefits.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-600">
                Účetní kanceláře?{' '}
                <a href="#ucetni-modul" className="text-violet-700 font-medium hover:underline">
                  Modul více klientů v ceníku
                </a>{' '}
                — neomezený počet klientů, každý s vlastním systémem.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Upload,
                title: 'PDF drag & drop + e-mail',
                desc: 'Nahrajte fakturu přetažením nebo pošlete na @in.audeflow.cz. Žádná instalace.',
              },
              {
                icon: FileText,
                title: 'České účetnictví',
                desc: 'České sazby DPH, účetní osnova, předkontace 504/343/321 a kontrola duplicit.',
              },
              {
                icon: Sparkles,
                title: '8 účetních systémů',
                desc: `API do ${CLOUD_SYSTEMS}. Export Pohoda, Money S3, Helios.`,
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 text-center">
              Ceník
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Tarify podle objemu faktur
            </h2>
            <p className="text-gray-500 text-center mb-12">
              Solo zdarma ({soloFreePerMonthLabel()}, 1 systém). Standard od 2,99 Kč/faktura. Tarify Standard
              a Pro pokrývají objem faktur — modul více klientů je samostatný doplněk pro účetní
              kanceláře.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {BILLING_TIERS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 flex flex-col ${
                    plan.highlighted
                      ? 'border-emerald-500 shadow-lg shadow-emerald-50 ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3">{plan.tagline}</p>
                  <div className="mt-1 mb-5">
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.benefits.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={getLandingTierHref(plan, isAuthenticated)}>
                    <Button
                      className={`w-full ${plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                    >
                      {plan.id === 'free'
                        ? isAuthenticated
                          ? 'Nahrát fakturu'
                          : 'Registrovat zdarma'
                        : `Tarif ${plan.name}`}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <div
              id="ucetni-modul"
              className="rounded-2xl border border-violet-300 bg-violet-50 p-6 sm:p-8 max-w-2xl mx-auto mt-8"
            >
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-700 bg-violet-100 rounded-full px-3 py-1 mb-4">
                <Building2 className="h-3.5 w-3.5" />
                Pro účetní kanceláře
              </div>
              <h3 className="text-xl font-bold text-gray-900">{MULTI_CLIENT_ADDON.name}</h3>
              <p className="text-sm text-gray-600 mt-2 mb-4">{MULTI_CLIENT_ADDON.tagline}</p>
              <p className="text-2xl font-extrabold text-violet-700 mb-5">
                +{MULTI_CLIENT_ADDON.price}
                <span className="text-sm font-normal text-gray-500">{MULTI_CLIENT_ADDON.period}</span>
              </p>
              <ul className="space-y-2.5 text-left mb-6">
                {MULTI_CLIENT_ADDON.benefits.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={getMultiClientAddonHref(isAuthenticated)} className="inline-block">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  {isAuthenticated ? 'Aktivovat modul' : 'Přihlásit se a aktivovat'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <SeoRichContentSection />

        <section id="faq" className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
              Časté dotazy
            </h2>
            <div className="space-y-4">
              {MARKETING_FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group bg-white border border-gray-200 rounded-2xl p-5"
                >
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between gap-4">
                    {item.q}
                    <span className="text-gray-400 group-open:rotate-45 transition-transform shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <LandingAboutSection />

        <section className="bg-white py-16 sm:py-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Zpracujte první fakturu dnes
            </h2>
            <p className="text-gray-600 mb-8">
              Registrace zabere 2 minuty. Solo režim zdarma — {soloFreeMonthlyLabel()}, jeden fakturační
              systém. Bez kreditní karty.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={getLandingPrimaryCtaHref(isAuthenticated)}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Registrovat zdarma
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Přihlásit se
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-sm text-gray-500">Bez karty, výsledek za pár vteřin</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-gray-900 text-sm">{APP_NAME}</span>
          <LegalFooter />
        </div>
      </footer>
    </div>
  )
}
