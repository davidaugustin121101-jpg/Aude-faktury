import Link from 'next/link'

const STEPS = [
  {
    icon: '📄',
    title: 'Nahraj PDF',
    desc: 'Přetáhni fakturu od dodavatele. Žádné e-maily, žádné skenování v iDokladu.',
  },
  {
    icon: '🤖',
    title: 'AI přečte a navrhne účetní kód',
    desc: 'Claude extrahuje data a navrhne účetní kód dle české účtové osnovy (518, 501, 502…).',
  },
  {
    icon: '✓',
    title: 'Schválíš a odešleš',
    desc: 'Zkontroluj náhled, uprav co potřebuješ, jedním klikem do iDokladu nebo Fakturoidu.',
  },
]

const BENEFITS = [
  {
    title: 'Bez drahého vyčítání v iDokladu',
    desc: 'iDoklad Inbox účtuje cca 600 Kč za 100 vyčtení. U nás AI běží v ceně plánu — do iDokladu posíláš už hotová data, ne platíš znovu za OCR.',
    highlight: true,
  },
  {
    title: 'Účetní kód automaticky',
    desc: 'iDoklad Inbox vyplní fakturu, ale neřekne ti, jestli patří na 518 (služby), 501 (materiál) nebo 502 (energie). Audeflow ano — s vysvětlením proč.',
    highlight: true,
  },
  {
    title: 'Kontrola před účetnictvím',
    desc: 'Nic neletí do systému bez tvého schválení. Vidíš náhled, můžeš opravit IČO, částku nebo kód — teprve pak odešleš.',
    highlight: false,
  },
  {
    title: 'iDoklad i Fakturoid z jednoho místa',
    desc: 'Nemusíš řešit dva workflow. Jedna appka, dva fakturační programy — podle toho, co tvoje firma používá.',
    highlight: false,
  },
  {
    title: 'Jeden klik místo přepisování',
    desc: 'Konec kopírování dodavatele, VS a částek ručně. PDF → schválení → přijatá faktura v účetnictví.',
    highlight: false,
  },
  {
    title: 'Pro živnostníky a malé firmy',
    desc: 'Navrženo pro české faktury, DPH 0/12/21 %, IČO, DIČ a běžnou účtovou osnovu. Bez složitého nastavení.',
    highlight: false,
  },
]

const COMPARISON = [
  {
    label: 'Ruční přepis',
    bad: true,
    items: ['15–30 min na fakturu', 'Chyby v IČO a částkách', 'Účetní kód hledáš sám'],
  },
  {
    label: 'iDoklad Inbox',
    bad: false,
    neutral: true,
    items: ['Vyčtení PDF v iDokladu', '600 Kč / 100 vyčtení', 'Bez návrhu účetního kódu', 'Jen iDoklad'],
  },
  {
    label: 'Audeflow Faktury',
    bad: false,
    winner: true,
    items: [
      'AI vyčtení v ceně plánu',
      'Návrh účetního kódu + důvod',
      'Schválení před odesláním',
      'iDoklad + Fakturoid',
    ],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-lg">Audeflow Faktury</span>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">
              Přihlásit se
            </Link>
            <Link
              href="/register"
              className="text-sm bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700"
            >
              Začít zdarma
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <p className="text-sm font-medium text-blue-600 mb-4">
            Chytřejší než Inbox. Rychlejší než ruční přepis.
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            PDF faktura → účetnictví
            <br />
            <span className="text-blue-600">s účetním kódem a bez přepisování</span>
          </h1>
          <p className="text-gray-500 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            Přetáhni fakturu od dodavatele. AI přečte data, navrhne účetní kód a po tvém
            potvrzení odešle do <strong className="text-gray-700">iDokladu</strong> nebo{' '}
            <strong className="text-gray-700">Fakturoidu</strong>. Neplatíš 600 Kč za každých
            100 vyčtení v iDoklad Inboxu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-2xl text-lg"
            >
              Vyzkoušet zdarma — 10 faktur/měsíc
            </Link>
            <a
              href="#proc-audeflow"
              className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-8 py-4 rounded-2xl text-lg"
            >
              Proč zrovna Audeflow?
            </a>
          </div>
        </section>

        {/* Steps */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {STEPS.map((f, i) => (
              <div key={f.title} className="border border-gray-200 rounded-2xl p-6 relative">
                <span className="absolute top-4 right-4 text-xs font-bold text-gray-300">
                  {i + 1}
                </span>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section id="proc-audeflow" className="bg-gray-50 border-y border-gray-100 py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">
              Proč Audeflow Faktury?
            </h2>
            <p className="text-gray-500 text-center max-w-2xl mx-auto mb-10">
              iDoklad umí Inbox. Fakturoid umí Krabici. My děláme vrstvu navíc — účetní kód,
              schválení a odeslání bez drahého vyčítání v účetním programu.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className={`rounded-2xl p-5 border ${
                    b.highlight
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <h3
                    className={`font-semibold ${b.highlight ? 'text-blue-900' : 'text-gray-900'}`}
                  >
                    {b.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Srovnání s alternativami
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            {COMPARISON.map((col) => (
              <div
                key={col.label}
                className={`rounded-2xl p-5 border ${
                  col.winner
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : col.neutral
                      ? 'bg-white border-gray-200'
                      : 'bg-white border-gray-200 opacity-80'
                }`}
              >
                <p
                  className={`font-bold text-lg mb-4 ${
                    col.winner ? 'text-white' : col.bad ? 'text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {col.label}
                  {col.winner && (
                    <span className="ml-2 text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                      doporučeno
                    </span>
                  )}
                </p>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li
                      key={item}
                      className={`text-sm flex gap-2 ${
                        col.winner ? 'text-blue-50' : 'text-gray-600'
                      }`}
                    >
                      <span>{col.winner ? '✓' : col.bad ? '✗' : '·'}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* iDoklad Inbox callout */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8">
            <h3 className="font-bold text-amber-900 text-lg">
              Už používáš iDoklad Inbox?
            </h3>
            <p className="text-amber-900/80 text-sm mt-2 leading-relaxed max-w-3xl">
              Inbox je skvělý na sběr dokladů. Audeflow je skvělý na{' '}
              <strong>účtování a kontrolu</strong> — AI navrhne kód, ty schválíš a do iDokladu
              pošleš hotovou přijatou fakturu přes API. Nemusíš platit za vyčtení v Inboxu a
              nemusíš hledat, kam zaúčtovat položku. Ideální kombinace: Inbox na sběr, Audeflow
              na zpracování — nebo Audeflow úplně samostatně.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 pb-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Méně přepisování. Více kontroly. Levnější než Inbox OCR.
          </h2>
          <p className="text-gray-500 mt-3 mb-8">
            Začni zdarma s 10 fakturami měsíčně. Bez kreditní karty.
          </p>
          <Link
            href="/register"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-2xl text-lg"
          >
            Vytvořit účet zdarma
          </Link>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Audeflow · faktury.audeflow.cz
      </footer>
    </div>
  )
}
