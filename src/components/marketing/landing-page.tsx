import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Sparkles,
  Upload,
  User,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BILLING_TIERS, MULTI_CLIENT_ADDON } from '@/lib/account-mode'
import { APP_NAME, APP_TAGLINE, EXTRACTION_LABEL } from '@/lib/brand'

const STEPS = [
  {
    title: 'Nahrajte PDF fakturu',
    desc: 'Přetáhněte PDF do aplikace. Poradíme si i se skenovanými fakturami.',
  },
  {
    title: EXTRACTION_LABEL,
    desc: 'Automaticky vytěžíme dodavatele, IČO, částku, DPH i položky do 10 sekund.',
  },
  {
    title: 'Návrh účetního kódu',
    desc: 'Systém navrhne správný účetní kód pro CZ nebo SK účetnictví.',
  },
  {
    title: 'Zkontrolujete a schválíte',
    desc: 'Vidíte přesně co se odešle. Nic neposíláme bez vašeho souhlasu.',
  },
  {
    title: 'Faktura je v účetnictví',
    desc: 'Jedním kliknutím do vašeho iDokladu, Fakturoidu nebo SuperFaktury.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Přihlásit se
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Registrovat zdarma
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="max-w-6xl mx-auto px-4 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Automatické zpracování faktur
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              PDF faktura do účetnictví.{' '}
              <span className="text-blue-600">Za 30 sekund.</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-xl">
              Nahrajte fakturu, systém ji vytěží a odešle do vašeho fakturačního systému. Jeden účet =
              jeden systém (iDoklad, Fakturoid nebo SuperFaktura). Pro účetní firmy s více klienty
              nabízíme samostatný režim.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
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
            <div className="mt-8 flex flex-wrap gap-2">
              {['Solo zdarma', '1 fakturační systém', '10 faktur / měsíc', 'CZ + SK DPH'].map(
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

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-8 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '0 Kč', label: 'Solo režim' },
                { val: '1', label: 'fakturační systém' },
                { val: '10', label: 'faktur zdarma / měsíc' },
                { val: '299 Kč', label: 'účetní režim / měsíc' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl p-5 border border-white/80 shadow-sm"
                >
                  <p className="text-2xl font-bold text-gray-900">{s.val}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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

        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10">
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full px-3 py-1 mb-4">
                <User className="h-3.5 w-3.5" />
                Solo — zdarma
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Pro podnikatele a OSVČ</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Jeden účet, jeden fakturační systém dle vašeho výběru. 10 faktur měsíčně zdarma.
                Ideální pokud fakturujete sami za sebe.
              </p>
              <ul className="space-y-2">
                {BILLING_TIERS[0].benefits.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-violet-600 rounded-3xl p-8 text-white">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white/10 rounded-full px-3 py-1 mb-4">
                <Building2 className="h-3.5 w-3.5" />
                Účetní firma — 299 Kč/měs
              </div>
              <h2 className="text-2xl font-bold mb-3">Více klientů, každý vlastní systém</h2>
              <p className="text-violet-100 leading-relaxed mb-6">
                Pro účetní kanceláře. Každý klient má vlastní workspace a vlastní napojení na iDoklad,
                Fakturoid nebo SuperFakturu. Přepínání klienta trvá jednu sekundu.
              </p>
              <ul className="space-y-2">
                {BILLING_TIERS[1].benefits.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-violet-50">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Upload,
                title: 'PDF drag & drop',
                desc: 'Nahrajte fakturu přetažením. Žádná instalace, funguje v prohlížeči.',
              },
              {
                icon: FileText,
                title: 'CZ i SK účetnictví',
                desc: 'Různé sazby DPH a účetní kódy pro Česko i Slovensko.',
              },
              {
                icon: Sparkles,
                title: EXTRACTION_LABEL,
                desc: 'Automatické čtení dodavatele, IČO, částek a návrh účetního kódu.',
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
              Solo zdarma, Standard 100 faktur, Pro neomezeně. Modul více klientů (+299 Kč) jako
              doplněk k placenému tarifu.
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
                  <Link href="/register">
                    <Button
                      className={`w-full ${plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                    >
                      {plan.id === 'free' ? 'Registrovat zdarma' : `Tarif ${plan.name}`}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6 max-w-md mx-auto mt-8">
              <h3 className="text-lg font-bold text-gray-900">{MULTI_CLIENT_ADDON.name}</h3>
              <p className="text-xs text-gray-600 mt-1 mb-3">{MULTI_CLIENT_ADDON.tagline}</p>
              <p className="text-2xl font-extrabold text-violet-700">
                +{MULTI_CLIENT_ADDON.price}
                <span className="text-sm font-normal text-gray-500">{MULTI_CLIENT_ADDON.period}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Zpracujte první fakturu dnes</h2>
            <p className="text-gray-600 mb-8">
              Registrace zabere 2 minuty. Solo režim zdarma — 10 faktur měsíčně, jeden fakturační
              systém. Bez kreditní karty.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/register">
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
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{APP_NAME}</span>
          <span>© 2026 AUDE FLOW · IČO: 10841067</span>
          <a href="mailto:podpora@audeflow.cz" className="hover:text-blue-600">
            podpora@audeflow.cz
          </a>
        </div>
      </footer>
    </div>
  )
}
