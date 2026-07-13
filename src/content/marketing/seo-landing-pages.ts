import { SOLO_INVOICE_LIMIT, soloFreeMonthlyLabel } from '@/lib/account-mode'

export type SeoLandingPage = {
  slug: string
  title: string
  description: string
  h1: string
  intro: string
  sections: { heading: string; body: string }[]
  keywords: string[]
  relatedSlugs: string[]
  priority: number
}

const freeLine = soloFreeMonthlyLabel()

export const SEO_LANDING_PAGES: SeoLandingPage[] = [
  {
    slug: 'vytezeni-faktur',
    title: 'Vytěžení faktur — automatické OCR od 2,99 Kč | Audeflow',
    description: `Nejlevnější vytěžení PDF faktur v ČR. ${freeLine}, Standard 2,99 Kč/faktura. Předkontace, ARES, duplicity. Export do iDokladu, Pohody, Fakturoidu.`,
    h1: 'Vytěžení faktur — automatické zpracování PDF',
    intro:
      'Audeflow vytěží přijatou fakturu z PDF během sekund: dodavatel, IČO, DIČ, částky, DPH, VS, IBAN, položky i typ dokladu. Navrhne českou předkontaci MD/DAL a odešle data do vašeho účetního systému nebo je exportuje do souboru.',
    sections: [
      {
        heading: 'Proč zvolit Audeflow pro vytěžení faktur',
        body: `Cena od 2,99 Kč za fakturu patří mezi nejnižší na českém trhu. ${freeLine} pro tarif Solo (${SOLO_INVOICE_LIMIT} faktur měsíčně). Na rozdíl od jednorázových OCR nástrojů nabízíme kompletní workflow — audit, kontrolu duplicit, návrh účetního kódu a přímé API napojení na iDoklad, Fakturoid, SuperFakturu, BitFakturu a Súčto.`,
      },
      {
        heading: 'Co přesně vytěžíme z PDF faktury',
        body: 'Dodavatel a odběratel včetně IČO/DIČ z ARES, číslo faktury, datum vystavení a splatnosti, variabilní symbol, IBAN, částky bez DPH, sazbu DPH, celkovou částku, položky faktury a typ dokladu (záloha, daňový doklad, dobropis).',
      },
      {
        heading: 'Jak začít',
        body: 'Zaregistrujte se zdarma, nahrajte PDF nebo pošlete fakturu na @in.audeflow.cz. Po kontrole jedním kliknutím odešlete do účetnictví nebo stáhněte export pro Pohodu, Money S3 či Helios.',
      },
    ],
    keywords: [
      'vytěžení faktur',
      'vytěžení PDF faktury',
      'automatické vytěžení faktur',
      'vytěžení faktury cena',
      'nejlevnější vytěžení faktur',
    ],
    relatedSlugs: ['ocr-faktury', 'automaticke-zpracovani-faktur', 'nejlevnejsi-vytezeni-faktur'],
    priority: 0.95,
  },
  {
    slug: 'automaticke-zpracovani-faktur',
    title: 'Automatické zpracování faktur — AI OCR a export | Audeflow',
    description:
      'Automatizujte přijaté faktury: upload PDF, e-mail @in.audeflow.cz, vytěžení, předkontace a odeslání do účetnictví. Pro OSVČ i účetní kanceláře.',
    h1: 'Automatické zpracování přijatých faktur',
    intro:
      'Přestaňte ručně přepisovat faktury. Audeflow automaticky zpracuje PDF — od extrakce dat přes audit až po zápis do iDokladu, Fakturoidu nebo export do Pohody. Ideální pro firmy s desítkami přijatých dokladů měsíčně.',
    sections: [
      {
        heading: 'Automatizace od nahrání po účetnictví',
        body: 'Nahrajte PDF, pošlete e-mailem nebo použijte mobilní prohlížeč. Systém vytěží data, zkontroluje matematiku a DPH, ověří IČO v ARES a navrhne předkontaci. Poté jedním kliknutím odešlete do cloudového fakturačního systému nebo stáhnete soubor pro desktopové ERP.',
      },
      {
        heading: 'E-mailový sběr faktur',
        body: 'Každý uživatel má adresu @in.audeflow.cz. PDF přílohy z e-mailu zpracujeme stejně jako upload — plná automatizace bez ručního zásahu.',
      },
      {
        heading: 'Pro účetní firmy',
        body: 'Modul více klientů umožňuje přepínat mezi workspaces — každý klient může mít jiný fakturační systém. Jedno rozhraní místo pěti přihlášení.',
      },
    ],
    keywords: [
      'automatické zpracování faktur',
      'automatizace faktur',
      'zpracování přijatých faktur',
      'AI faktury',
      'automatický import faktur',
    ],
    relatedSlugs: ['vytezeni-faktur', 'faktury-emailem', 'faktury-pro-ucetni'],
    priority: 0.92,
  },
  {
    slug: 'ocr-faktury',
    title: 'OCR faktury — čtení PDF faktur s předkontací | Audeflow',
    description:
      'OCR a AI vytěžení českých PDF faktur. Ne jen text — účetní kód, předkontace 504/343/321, položky, DPH a export do účetnictví.',
    h1: 'OCR faktury — inteligentní čtení PDF dokladů',
    intro:
      'Klasické OCR přečte text. Audeflow jde dál — rozpozná strukturu české faktury, typ dokladu, sazby DPH a navrhne účetní zápis. Výsledek můžete rovnou odeslat do iDokladu, Fakturoidu nebo exportovat do Pohody.',
    sections: [
      {
        heading: 'OCR vs. chytré vytěžení',
        body: 'OCR vrací surový text. Audeflow mapuje pole na účetní strukturu — dodavatel, částky, položky, zálohy, dobropisy — a připraví předkontaci pro české účetnictví.',
      },
      {
        heading: 'Podpora českých faktur',
        body: 'Faktury v češtině i angličtině, smíšené sazby DPH, zálohové faktury, daňové doklady k záloze a položkové faktury se split předkontací.',
      },
    ],
    keywords: ['OCR faktury', 'OCR faktura', 'čtení faktur PDF', 'AI OCR faktura', 'parsování faktury'],
    relatedSlugs: ['vytezeni-faktur', 'predkontace-faktury', 'prijate-faktury-online'],
    priority: 0.9,
  },
  {
    slug: 'nejlevnejsi-vytezeni-faktur',
    title: 'Nejlevnější vytěžení faktur v ČR — od 2,99 Kč | Audeflow',
    description: `${freeLine}. Standard 100 faktur za 299 Kč = 2,99 Kč/faktura. Srovnání cen vytěžení faktur na českém trhu.`,
    h1: 'Nejlevnější vytěžení faktur v České republice',
    intro:
      'Audeflow nabízí jednu z nejnižších cen automatického vytěžení a exportu faktur v ČR. Platíte za zpracované doklady, ne za drahé měsíční licence — kredit neexpiruje.',
    sections: [
      {
        heading: 'Transparentní ceník',
        body: `Solo: ${freeLine} (${SOLO_INVOICE_LIMIT} faktur/měsíc). Standard: 299 Kč za 100 faktur — 2,99 Kč za kus, jednorázově. Modul více klientů pro účetní firmy od 299 Kč/měsíc. Bez skrytých poplatků za API napojení.`,
      },
      {
        heading: 'Srovnání s trhem',
        body: 'Mnoho řešení účtuje desítky korun za fakturu nebo vyžaduje drahé roční předplatné. Audeflow je navržen pro OSVČ, malé firmy i účetní kanceláře, které chtějí platit jen za reálně zpracované doklady.',
      },
    ],
    keywords: [
      'nejlevnější vytěžení faktur',
      'nejnižší cena OCR faktury',
      'levné vytěžení faktur',
      'vytěžení faktury cena',
      'automatizace faktur levně',
    ],
    relatedSlugs: ['vytezeni-faktur', 'alternativa-ctenifaktur', 'faktury-pro-ucetni'],
    priority: 0.9,
  },
  {
    slug: 'vytezeni-faktury-idoklad',
    title: 'Vytěžení faktury do iDokladu — API import | Audeflow',
    description:
      'Automatický import přijaté faktury do iDokladu včetně PDF přílohy, ARES, předkontace a účetního kódu. Napojení přes OAuth2.',
    h1: 'Vytěžení faktury a odeslání do iDokladu',
    intro:
      'Propojte Audeflow s iDokladem přes API. Vytěžená PDF faktura se zapíše jako přijatý doklad s přílohou, dodavatelem z ARES a návrhem předkontace v poznámce.',
    sections: [
      {
        heading: 'Co se zapíše do iDokladu',
        body: 'Dodavatel, částky, DPH, VS, datumy, položky faktury, PDF příloha a text předkontace MD/DAL pro rychlou kontrolu účetní.',
      },
      {
        heading: 'Napojení API',
        body: 'V nastavení Audeflow najdete návod na OAuth2 token v iDokladu (Aplikace a služby). Po propojení odesíláte faktury jedním kliknutím.',
      },
    ],
    keywords: ['iDoklad import faktury', 'vytěžení faktury iDoklad', 'iDoklad API faktura', 'iDoklad přijatá faktura'],
    relatedSlugs: ['vytezeni-faktur', 'vytezeni-faktury-fakturoid', 'faktury-pro-ucetni'],
    priority: 0.88,
  },
  {
    slug: 'vytezeni-faktury-fakturoid',
    title: 'Vytěžení faktury do Fakturoidu — náklady a API | Audeflow',
    description:
      'Import PDF faktury do Fakturoidu jako náklad s tagem účetního kódu a předkontací. Client credentials nebo OAuth.',
    h1: 'Vytěžení faktury a zápis do Fakturoidu',
    intro:
      'Audeflow vytěží PDF a zapíše fakturu jako náklad ve Fakturoidu — včetně přílohy, účetního kódu v tagu a poznámky s předkontací.',
    sections: [
      {
        heading: 'Více než vestavěné vytěžení Fakturoidu',
        body: 'Audeflow pokrývá i klienty na iDokladu, SuperFaktuře, BitFaktuře a Súčtu — jedno rozhraní pro účetní firmy. Navíc export do Pohody, Money S3 a Helios, které Fakturoid nepokrývá.',
      },
    ],
    keywords: ['Fakturoid import faktury', 'Fakturoid náklady', 'vytěžení faktury Fakturoid', 'Fakturoid API výdaj'],
    relatedSlugs: ['vytezeni-faktury-idoklad', 'vytezeni-faktury-superfaktura', 'vytezeni-faktur'],
    priority: 0.88,
  },
  {
    slug: 'vytezeni-faktury-superfaktura',
    title: 'Vytěžení faktury do SuperFaktury — API náklady | Audeflow',
    description:
      'Odeslání vytěžené faktury do SuperFaktury včetně base64 PDF, dodavatele z ARES a předkontace.',
    h1: 'Vytěžení faktury a import do SuperFaktury',
    intro:
      'Automatický import přijatých faktur do SuperFaktury přes API — PDF příloha, položky, DPH a předkontace v poznámce.',
    sections: [
      {
        heading: 'Workflow pro SuperFakturu',
        body: 'Upload PDF → vytěžení → audit → odeslání nákladu do SuperFaktury. Dodavatel se doplní z ARES podle IČO.',
      },
    ],
    keywords: ['SuperFaktura náklady', 'SuperFaktura import PDF', 'vytěžení faktury SuperFaktura'],
    relatedSlugs: ['vytezeni-faktury-fakturoid', 'vytezeni-faktury-bitfaktura', 'vytezeni-faktur'],
    priority: 0.85,
  },
  {
    slug: 'vytezeni-faktury-bitfaktura',
    title: 'Vytěžení faktury do BitFaktury — výdajová faktura | Audeflow',
    description:
      'Vytvoření výdajové faktury (income: 0) v BitFaktuře z PDF — položky, DPH, předkontace.',
    h1: 'Vytěžení faktury a zápis do BitFaktury',
    intro:
      'Audeflow vytěží PDF a vytvoří ve BitFaktuře výdajovou fakturu s položkami, sazbami DPH a interní poznámkou předkontace.',
    sections: [
      {
        heading: 'BitFaktura API',
        body: 'Propojení přes API token v nastavení BitFaktury. Po schválení v Audeflow odešlete doklad jedním kliknutím.',
      },
    ],
    keywords: ['BitFaktura výdajová faktura', 'BitFaktura import faktury', 'vytěžení faktury BitFaktura'],
    relatedSlugs: ['vytezeni-faktury-sucto', 'vytezeni-faktury-superfaktura', 'vytezeni-faktur'],
    priority: 0.85,
  },
  {
    slug: 'vytezeni-faktury-sucto',
    title: 'Vytěžení faktury do Súčta — přijatý doklad API | Audeflow',
    description:
      'Založení přijatého dokladu ve Súčtu — partner z ARES, řádky faktury, DPH a VS z PDF.',
    h1: 'Vytěžení faktury a import do Súčta',
    intro:
      'Automatické založení přijatého dokladu ve Súčtu po vytěžení PDF — partner, položky, DPH a variabilní symbol.',
    sections: [
      {
        heading: 'Súčto a slovenský trh',
        body: 'Audeflow podporuje Súčto pro firmy na slovenském trhu i české účetní kanceláře se slovenskými klienty.',
      },
    ],
    keywords: ['Súčto přijatá faktura', 'Súčto API doklad', 'vytěžení faktury Súčto', 'Súčto import faktury'],
    relatedSlugs: ['vytezeni-faktury-bitfaktura', 'vytezeni-faktury-idoklad', 'vytezeni-faktur'],
    priority: 0.85,
  },
  {
    slug: 'export-faktur-pohoda',
    title: 'Export faktur do Pohody — XML s předkontací | Audeflow',
    description:
      'Stažení Pohoda XML pro přijatou fakturu s MD/DAL předkontací. Import přes Datovou komunikaci ve Stormware Pohoda.',
    h1: 'Export přijatých faktur do Pohody (XML)',
    intro:
      'Vytěžte PDF fakturu v Audeflow a stáhněte soubor Pohoda XML připravený k importu — včetně předkontace, DPH a dodavatele.',
    sections: [
      {
        heading: 'Pohoda XML export',
        body: 'Export obsahuje MD/DAL předkontaci pro české účetnictví. Importujete ve Stormware Pohoda přes Datovou komunikaci.',
      },
      {
        heading: 'Pro koho je export do Pohody',
        body: 'Ideální pro firmy a účetní kanceláře používající desktopovou Pohodu — bez ručního přepisování z PDF.',
      },
    ],
    keywords: ['Pohoda import faktury', 'Pohoda XML faktura', 'export Pohoda', 'Pohoda přijatá faktura'],
    relatedSlugs: ['import-faktur-money-s3', 'export-faktur-helios', 'vytezeni-faktur'],
    priority: 0.88,
  },
  {
    slug: 'import-faktur-money-s3',
    title: 'Import faktur do Money S3 — XML a ISDOC | Audeflow',
    description:
      'Export vytěžené faktury pro Money S3 — nativní XML nebo ISDOC pro spolehlivý import přijatých dokladů.',
    h1: 'Import faktur do Money S3 z PDF',
    intro:
      'Audeflow vytěží PDF a vygeneruje soubor pro Money S3 — XML nebo ISDOC podle vašeho nastavení exportu.',
    sections: [
      {
        heading: 'Money S3 workflow',
        body: 'Nahrání → vytěžení → kontrola → stažení exportu → import v Money S3. Předkontace MD/DAL je součástí exportu.',
      },
    ],
    keywords: ['Money S3 faktura', 'Money S3 import', 'export Money S3', 'Money S3 XML'],
    relatedSlugs: ['export-faktur-pohoda', 'export-faktur-helios', 'vytezeni-faktur'],
    priority: 0.85,
  },
  {
    slug: 'export-faktur-helios',
    title: 'Export faktur do Helios — CSV a XML | Audeflow',
    description:
      'Helios Red CSV a Helios iNuvio XML — připravené soubory pro import přijatých faktur z vytěženého PDF.',
    h1: 'Export faktur do Helios (Red / iNuvio)',
    intro:
      'Pro uživatele ekonomického systému Helios nabízíme export CSV (Helios Red) nebo XML (Helios iNuvio) s vytěženými daty a předkontací.',
    sections: [
      {
        heading: 'Helios export formáty',
        body: 'Vyberte formát podle vaší verze Helios. Data zahrnují dodavatele, částky, DPH, VS a návrh účetního zápisu.',
      },
    ],
    keywords: ['Helios faktura', 'Helios import CSV', 'Helios Red', 'Helios iNuvio export'],
    relatedSlugs: ['export-faktur-pohoda', 'import-faktur-money-s3', 'vytezeni-faktur'],
    priority: 0.85,
  },
  {
    slug: 'faktury-pro-ucetni',
    title: 'Faktury pro účetní kanceláře — více klientů | Audeflow',
    description:
      'Vytěžení faktur pro účetní firmy: neomezené workspaces, různé systémy na klienta, přepínání jedním kliknutím.',
    h1: 'Vytěžení faktur pro účetní kanceláře',
    intro:
      'Účetní kanceláře spravují desítky klientů na různých platformách. Audeflow s modulem více klientů umožňuje jedno přihlášení, vlastní API napojení na klienta a rychlé přepínání mezi workspaces.',
    sections: [
      {
        heading: 'Modul více klientů',
        body: 'Od 299 Kč/měsíc k tarifu Standard nebo Pro. Každý klient může mít jiný systém — iDoklad, Fakturoid, SuperFaktura, Pohoda export atd.',
      },
      {
        heading: 'Předkontace pro rychlou kontrolu',
        body: 'Návrh MD/DAL je v poznámce nebo exportu — účetní projde audit za minuty místo hodin ručního přepisování.',
      },
    ],
    keywords: [
      'faktury pro účetní',
      'účetní kancelář faktury',
      'vytěžení faktur účetní',
      'účetní kancelář automatizace',
    ],
    relatedSlugs: ['ucetni-kancelar-automatizace', 'vytezeni-faktur', 'nejlevnejsi-vytezeni-faktur'],
    priority: 0.9,
  },
  {
    slug: 'ucetni-kancelar-automatizace',
    title: 'Automatizace faktur v účetní kanceláři | Audeflow',
    description:
      'Zrychlete zpracování přijatých faktur klientů — OCR, předkontace, API do iDokladu/Fakturoidu, export Pohoda/Helios.',
    h1: 'Automatizace zpracování faktur v účetní kanceláři',
    intro:
      'Nahraďte ruční přepisování PDF automatickým vytěžením. Audeflow zkrátí čas na kontrolu dokladů a sníží chybovost díky auditu a kontrole duplicit.',
    sections: [
      {
        heading: 'Jeden nástroj pro všechny systémy klientů',
        body: 'Místo oddělených řešení pro každý fakturační systém použijte Audeflow napříč iDokladem, Fakturoidem, SuperFakturou, BitFakturou, Súčtem i exporty do Pohody, Money S3 a Helios.',
      },
    ],
    keywords: ['účetní kancelář automatizace', 'automatizace účetnictví faktury', 'účetní software faktury'],
    relatedSlugs: ['faktury-pro-ucetni', 'automaticke-zpracovani-faktur', 'vytezeni-faktur'],
    priority: 0.88,
  },
  {
    slug: 'predkontace-faktury',
    title: 'Předkontace faktury — návrh MD/DAL automaticky | Audeflow',
    description:
      'Automatický návrh předkontace a účetního kódu (504/343/321) z PDF faktury. Zálohy, dobropisy, split položky.',
    h1: 'Automatická předkontace faktury',
    intro:
      'Audeflow nenavrhuje jen surová data z PDF — navrhne český účetní kód a kompletní předkontaci MD/DAL včetně DPH, zálohových faktur a daňových dokladů.',
    sections: [
      {
        heading: 'Typické předkontace',
        body: 'Běžná faktura se 21% DPH: např. 504/343/321. Zálohové faktury, dobropisy a smíšené položky — split předkontace pro více účetních kódů.',
      },
      {
        heading: 'Kontrola před odesláním',
        body: 'Předkontaci vidíte v auditní obrazovce a v poznámce exportu/API — účetní může upravit před finálním zápisem.',
      },
    ],
    keywords: ['předkontace faktury', 'účetní kód faktura', '504 343 321', 'MD DAL faktura', 'předkontace automaticky'],
    relatedSlugs: ['ocr-faktury', 'vytezeni-faktur', 'prijate-faktury-online'],
    priority: 0.87,
  },
  {
    slug: 'faktury-emailem',
    title: 'Faktury e-mailem — @in.audeflow.cz automatické vytěžení',
    description:
      'Pošlete PDF fakturu na @in.audeflow.cz a systém ji automaticky vytěží. Stejný workflow jako upload — audit a export.',
    h1: 'Zpracování faktur z e-mailu',
    intro:
      'Každý uživatel Audeflow má unikátní adresu @in.audeflow.cz. PDF přílohy z příchozího e-mailu se zpracují automaticky — vytěžení, audit a příprava k exportu.',
    sections: [
      {
        heading: 'Jak funguje e-mailový vstup',
        body: 'Přepošlete fakturu od dodavatele na svou @in.audeflow.cz adresu. Systém rozpozná PDF přílohy a spustí stejný pipeline jako při drag & drop nahrání.',
      },
      {
        heading: 'Ideální pro mobil a forward',
        body: 'Účetní i podnikatelé mohou přeposílat faktury z telefonu — bez přihlašování do aplikace při každém dokladu.',
      },
    ],
    keywords: ['faktura e-mailem', 'in.audeflow.cz', 'PDF faktura email', 'automatický sběr faktur'],
    relatedSlugs: ['automaticke-zpracovani-faktur', 'vytezeni-faktur', 'prijate-faktury-online'],
    priority: 0.86,
  },
  {
    slug: 'prijate-faktury-online',
    title: 'Přijaté faktury online — zpracování a export | Audeflow',
    description:
      'Online zpracování přijatých faktur z PDF: vytěžení, kontrola duplicit, ARES, předkontace a odeslání do účetnictví.',
    h1: 'Online zpracování přijatých faktur',
    intro:
      'Spravujte přijaté faktury v prohlížeči — nahrajte PDF, zkontrolujte vytěžená data a odešlete do účetního systému. Funguje na počítači i mobilu.',
    sections: [
      {
        heading: 'Kontrola a audit',
        body: 'Kontrola matematiky, DPH, IČO v ARES, párování záloh a varování před duplicitním zaúčtováním stejné faktury.',
      },
    ],
    keywords: ['přijaté faktury', 'přijaté faktury online', 'zpracování přijatých faktur', 'evidence přijatých faktur'],
    relatedSlugs: ['vytezeni-faktur', 'ocr-faktury', 'faktury-emailem'],
    priority: 0.86,
  },
  {
    slug: 'alternativa-ctenifaktur',
    title: 'Alternativa k Čtení faktur — Audeflow od 2,99 Kč | srovnání',
    description:
      'Srovnání Audeflow a dalších řešení pro vytěžení faktur v ČR. Nižší cena, API napojení, Pohoda/Helios export, modul pro účetní firmy.',
    h1: 'Audeflow — moderní alternativa pro vytěžení faktur',
    intro:
      'Na českém trhu existuje více služeb pro čtení a vytěžení faktur (např. Čtení faktur, Digitoo, Flowis). Audeflow se zaměřuje na nejnižší cenu za doklad, napojení napříč systémy a export do desktopových ERP.',
    sections: [
      {
        heading: 'Cena a model',
        body: `${freeLine} pro Solo. Standard od 2,99 Kč za fakturu bez expirace kreditu. Bez nutnosti drahého ročního předplatného pro základní použití.`,
      },
      {
        heading: 'Napojení a export',
        body: 'Přímé API do iDokladu, Fakturoidu, SuperFaktury, BitFaktury a Súčta. Export Pohoda XML, Money S3 a Helios — vhodné pro účetní kanceláře se smíšeným portfoliem klientů.',
      },
      {
        heading: 'Předkontace a účetní workflow',
        body: 'Návrh českého účetního kódu a MD/DAL předkontace, kontrola duplicit, ARES a položková extrakce — ne jen OCR text z PDF.',
      },
    ],
    keywords: [
      'alternativa čtení faktur',
      'ctenifaktur alternativa',
      'vytěžení faktur srovnání',
      'nejlepší vytěžení faktur',
      'digitoo alternativa',
      'flowis alternativa',
    ],
    relatedSlugs: ['nejlevnejsi-vytezeni-faktur', 'faktury-pro-ucetni', 'vytezeni-faktur'],
    priority: 0.9,
  },
]

export const SEO_LANDING_SLUGS = SEO_LANDING_PAGES.map((p) => p.slug)

export function getSeoLandingPage(slug: string): SeoLandingPage | undefined {
  return SEO_LANDING_PAGES.find((p) => p.slug === slug)
}

export function getRelatedSeoPages(slugs: string[]): SeoLandingPage[] {
  return slugs
    .map((slug) => getSeoLandingPage(slug))
    .filter((p): p is SeoLandingPage => p !== undefined)
}
