import Image from 'next/image'
import { ArrowRight, CloudUpload, Download, Mail, Sparkles } from 'lucide-react'

type SupportedSystem = {
  name: string
  logo: string
}

const DIRECT_SYSTEMS: SupportedSystem[] = [
  { name: 'iDoklad', logo: '/logos/systems/idoklad.png' },
  { name: 'Fakturoid', logo: '/logos/systems/fakturoid.png' },
  { name: 'SuperFaktura', logo: '/logos/systems/superfaktura.png' },
  { name: 'BitFaktura', logo: '/logos/systems/bitfaktura.png' },
  { name: 'Súčto', logo: '/logos/systems/sucto.png' },
]

const EXPORT_SYSTEMS: SupportedSystem[] = [
  { name: 'Pohoda', logo: '/logos/systems/pohoda.png' },
  { name: 'Money S3', logo: '/logos/systems/money-s3.png' },
  { name: 'Helios', logo: '/logos/systems/helios.png' },
]

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
    desc: 'Přímé API do iDokladu, Fakturoidu, SuperFaktury, BitFaktury nebo Súčta včetně předkontace v poznámce.',
  },
] as const

function SystemLogoCard({ name, logo }: SupportedSystem) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm"
      title={name}
    >
      <div className="relative h-12 w-full max-w-[180px]">
        <Image
          src={logo}
          alt={`Logo ${name}`}
          fill
          className="object-contain object-center"
          sizes="180px"
        />
      </div>
      <span className="text-[11px] font-medium text-gray-500 text-center leading-tight">{name}</span>
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
          připravený export (Pohoda XML, Money S3, Helios) a naimportujete ho ve svém programu.
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DIRECT_SYSTEMS.map((s) => (
                <SystemLogoCard key={s.name} {...s} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Stažení souboru</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Pohoda XML, Money S3 nebo Helios — jedno tlačítko Stáhnout na detailu faktury, import ve vašem ERP.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {EXPORT_SYSTEMS.map((s) => (
                <SystemLogoCard key={s.name} {...s} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-6 py-5 mb-16">
          <p className="text-center text-sm text-gray-500 mb-4">Všechny podporované systémy na jednom místě</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {[...DIRECT_SYSTEMS, ...EXPORT_SYSTEMS].map((s) => (
              <div key={`strip-${s.name}`} className="relative h-10 w-[120px] opacity-90 hover:opacity-100 transition-opacity">
                <Image
                  src={s.logo}
                  alt={s.name}
                  fill
                  className="object-contain object-center"
                  sizes="120px"
                />
              </div>
            ))}
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
