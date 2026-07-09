/** Integrace přes API — zobrazujeme logem na landingu */
export const API_ACCOUNTING_SYSTEMS = [
  {
    id: 'idoklad',
    name: 'iDoklad',
    slug: 'idoklad',
    keywords: [
      'iDoklad import faktury',
      'iDoklad přijatá faktura',
      'iDoklad API faktura',
      'vytěžení faktury iDoklad',
    ],
    description:
      'Automatické odeslání přijaté faktury do iDokladu včetně PDF přílohy, účetního kódu a návrhu předkontace. Napojení přes OAuth2 nebo API token.',
  },
  {
    id: 'fakturoid',
    name: 'Fakturoid',
    slug: 'fakturoid',
    keywords: [
      'Fakturoid náklady',
      'Fakturoid import faktury',
      'Fakturoid API výdaj',
      'vytěžení faktury Fakturoid',
    ],
    description:
      'Vytěžená PDF faktura se zapíše jako náklad ve Fakturoidu s tagem účetního kódu a poznámkou předkontace. Client credentials nebo OAuth token.',
  },
  {
    id: 'superfaktura',
    name: 'SuperFaktura',
    slug: 'superfaktura',
    keywords: [
      'SuperFaktura náklady',
      'SuperFaktura import PDF',
      'SuperFaktura API faktura',
      'vytěžení faktury SuperFaktura',
    ],
    description:
      'Odeslání nákladu do SuperFaktury včetně base64 PDF přílohy, dodavatele z ARES a předkontace v poznámce.',
  },
  {
    id: 'bitfaktura',
    name: 'BitFaktura',
    slug: 'bitfaktura',
    keywords: [
      'BitFaktura výdajová faktura',
      'BitFaktura import faktury',
      'BitFaktura API náklady',
      'vytěžení faktury BitFaktura',
    ],
    description:
      'Přijatá faktura se vytvoří ve BitFaktuře jako výdaj (income: 0) s položkami, DPH a interní poznámkou předkontace.',
  },
  {
    id: 'sucto',
    name: 'Súčto',
    slug: 'sucto',
    keywords: [
      'Súčto přijatá faktura',
      'Súčto API doklad',
      'Súčto import faktury',
      'vytěžení faktury Súčto',
    ],
    description:
      'Založení přijatého dokladu ve Súčtu — partner z ARES, řádky faktury, DPH a variabilní symbol z vytěženého PDF.',
  },
] as const

/** Desktop ERP — export souboru */
export const ERP_EXPORT_SYSTEMS = [
  {
    id: 'pohoda',
    name: 'Pohoda',
    slug: 'pohoda',
    keywords: ['Pohoda import faktury', 'Pohoda XML faktura', 'Pohoda přijatá faktura', 'export Pohoda'],
    description:
      'Stažení Pohoda XML pro přijatou fakturu s MD/DAL předkontací. Import přes Datovou komunikaci ve Stormware Pohoda.',
  },
  {
    id: 'money-s3',
    name: 'Money S3',
    slug: 'money-s3',
    keywords: ['Money S3 faktura', 'Money S3 import', 'export Money S3', 'Money S3 XML'],
    description:
      'Export pro Money S3 — nativní XML nebo ISDOC soubor pro spolehlivý import přijatých dokladů.',
  },
  {
    id: 'helios',
    name: 'Helios',
    slug: 'helios',
    keywords: ['Helios faktura', 'Helios import CSV', 'Helios Red', 'Helios iNuvio export'],
    description:
      'Helios Red CSV a Helios iNuvio XML — připravené soubory pro import přijatých faktur do ekonomického systému.',
  },
] as const

export const EXTRACTION_FEATURES = [
  {
    title: 'Automatické vytěžení PDF faktury',
    keywords: ['vytěžení PDF faktury', 'OCR faktura', 'AI faktura', 'parsování faktury PDF'],
    text: 'Načteme dodavatele, IČO, DIČ, částky, sazbu DPH, VS, IBAN, položky faktury a typ dokladu (záloha, daňový doklad, dobropis).',
  },
  {
    title: 'Návrh předkontace a účetního kódu',
    keywords: ['předkontace faktury', 'účetní kód faktura', '504 343 321', 'MD DAL faktura'],
    text: 'Navrhneme český účetní kód (518, 504, 512…) a kompletní předkontaci MD/DAL včetně DPH a zálohových faktur.',
  },
  {
    title: 'E-mailový vstup faktur',
    keywords: ['faktura e-mailem', 'in.audeflow.cz', 'PDF faktura email', 'automatický sběr faktur'],
    text: 'Pošlete PDF na svou adresu @in.audeflow.cz — faktura se automaticky vytěží stejně jako při drag & drop uploadu.',
  },
  {
    title: 'Audit a kontrola duplicit',
    keywords: ['kontrola faktury', 'duplicita faktura', 'ARES IČO', 'audit DPH faktura'],
    text: 'Kontrola matematiky, DPH, IČO v ARES, párování záloh a varování před duplicitním zaúčtováním.',
  },
  {
    title: 'Položková faktura a split předkontace',
    keywords: ['položková faktura', 'split předkontace', 'více sazeb DPH', 'řádky faktury'],
    text: 'Vytěžíme jednotlivé položky faktury a navrhneme split předkontace pro smíšené zboží a služby.',
  },
] as const

export const PRICING_SEO = {
  headline: 'Nejnižší cena vytěžení faktur v ČR',
  perInvoice: '2,99 Kč',
  pack: '299 Kč / 100 faktur',
  free: '10 faktur měsíčně zdarma',
  keywords: [
    'nejlevnější vytěžení faktur',
    'nejnižší cena OCR faktury',
    'levné zpracování faktur',
    'vytěžení faktury cena',
    'automatizace faktur levně',
  ],
  text: 'Tarif Solo je zdarma (10 faktur/měsíc). Standard: 100 faktur za 299 Kč jednorázově — to je 2,99 Kč za fakturu bez expirace kreditu. Pro účetní firmy modul více klientů od 299 Kč/měsíc.',
} as const

export function allSeoKeywords(): string[] {
  const fromSystems = [...API_ACCOUNTING_SYSTEMS, ...ERP_EXPORT_SYSTEMS].flatMap((s) => s.keywords)
  const fromFeatures = EXTRACTION_FEATURES.flatMap((f) => f.keywords)
  return [...fromSystems, ...fromFeatures, ...PRICING_SEO.keywords]
}
