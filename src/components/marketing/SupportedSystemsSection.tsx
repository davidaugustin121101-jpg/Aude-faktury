import { ArrowRight, CloudUpload, Download, Mail, Sparkles } from 'lucide-react'

const DIRECT_SYSTEMS = [
  { name: 'iDoklad', color: 'text-blue-700', bg: 'bg-blue-50' },
  { name: 'Fakturoid', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { name: 'SuperFaktura', color: 'text-violet-700', bg: 'bg-violet-50' },
] as const

const EXPORT_SYSTEMS = [
  { name: 'Pohoda', color: 'text-orange-700', bg: 'bg-orange-50' },
  { name: 'Money S3', color: 'text-sky-700', bg: 'bg-sky-50' },
  { name: 'Helios', color: 'text-indigo-700', bg: 'bg-indigo-50' },
  { name: 'ISDOC', color: 'text-slate-700', bg: 'bg-slate-50' },
] as const

const STEPS = [
  {
    icon: Mail,
    title: 'Pošlete nebo nahrajte PDF',
    desc: 'Drag & drop, e-mail na vaši adresu @in.audeflow.cz, nebo přeposlání od dodavatele.',
  },
  {
    icon: Sparkles,
    title: 'Vytěžíme a navrhneme předkontaci',
    desc: 'Data z faktury + položky + účetní kód 504/343/321. Kontrola duplicit a ARES.',
  },
  {
    icon: CloudUpload,
    title: 'Odešleme nebo exportujeme',
    desc: 'Přímé API do iDokladu/Fakturoidu/SuperFaktury včetně PDF, nebo stažení souboru pro Pohodu/Money/Helios.',
  },
] as const

function SystemBadge({
  name,
  color,
  bg,
}: {
  name: string
  color: string
  bg: string
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 ${bg}`}
    >
      <span className={`text-sm font-bold tracking-tight ${color}`}>{name}</span>
    </div>
  )
}

export function SupportedSystemsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 text-center">
          Podporované systémy
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
          Kam faktura po zpracování putuje
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          Cloudové systémy napojíme přímo přes API včetně PDF přílohy. U desktopového ERP stáhnete
          připravený soubor (XML, ISDOC, CSV) a naimportujete ho ve svém programu.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CloudUpload className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Přímé odeslání (API)</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Plně automatické — faktura + PDF příloha + předkontace v poznámce.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DIRECT_SYSTEMS.map((s) => (
                <SystemBadge key={s.name} {...s} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Stažení souboru</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              XML, ISDOC nebo CSV — jedno tlačítko Stáhnout na detailu faktury, import ve vašem ERP.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {EXPORT_SYSTEMS.map((s) => (
                <SystemBadge key={s.name} {...s} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative text-center p-6">
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-10 -right-3 h-5 w-5 text-gray-300" />
              )}
              <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4">
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-blue-600 mb-1">Krok {i + 1}</p>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
