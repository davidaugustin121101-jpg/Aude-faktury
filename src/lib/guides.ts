export type GuideLink = {
  id: string
  title: string
  icon: string
  summary: string
  steps: string[]
  note?: string
  externalUrl?: string
  externalLabel?: string
  settingsHref: string
}

export const API_GUIDES: GuideLink[] = [
  {
    id: 'idoklad',
    title: 'iDoklad — API přístup',
    icon: '🧾',
    summary: 'Cloud fakturace pro ČR. Odesílání faktur přímo přes REST API.',
    steps: [
      'Přihlaste se do iDoklad → Nastavení → Aplikace a služby → Moje aplikace.',
      'Vytvořte novou aplikaci (OAuth2) a získejte Client ID a Client Secret.',
      'Alternativa: v iDoklad → Nastavení → API vygenerujte Bearer token.',
      'V Audeflow → Fakturační systém vyberte iDoklad a vložte údaje.',
      'Po nahrání faktury klikněte „Odeslat do iDoklad“ na detailu faktury.',
    ],
    note: 'iDoklad vyžaduje placený tarif s API přístupem.',
    externalUrl: 'https://app.idoklad.cz/Setting/Application',
    externalLabel: 'Nastavení aplikací v iDokladu',
    settingsHref: '/settings/accounting#idoklad',
  },
  {
    id: 'fakturoid',
    title: 'Fakturoid — API přístup',
    icon: '📊',
    summary: 'Oblíbený u OSVČ a malých firem v ČR.',
    steps: [
      'Fakturoid → Nastavení → Uživatelský účet → API → Nová integrace.',
      'Zadejte název (např. Audeflow) a zkopírujte Client ID + Client Secret.',
      'Ve Fakturoidu musíte mít placený tarif — free tarif neumožňuje vytvářet náklady přes API.',
      'V Audeflow vyberte Fakturoid a vložte Client ID a Secret.',
    ],
    note: 'Slug účtu najdete v URL: fakturoid.cz/a/VAS-SLUG/…',
    externalUrl: 'https://app.fakturoid.cz/user/account_api',
    externalLabel: 'API nastavení ve Fakturoidu',
    settingsHref: '/settings/accounting#fakturoid',
  },
  {
    id: 'superfaktura',
    title: 'SuperFaktura — API',
    icon: '📋',
    summary: 'Odesílání přijatých faktur přes API pro české účetnictví.',
    steps: [
      'SuperFaktura → Nástroje → API přístup → vytvořte API uživatele s rolí Administrátor.',
      'Zkopírujte email API účtu a API klíč.',
      'Ve SuperFaktuře musí být kompletně vyplněný firemní profil (IČO, adresa, DIČ).',
      'Company ID je volitelné — vyplňte jen pokud máte více firem pod jedním účtem.',
      'V Audeflow vyberte SuperFaktura a zadejte email + klíč.',
    ],
    externalUrl: 'https://moje.superfaktura.cz/tools/access',
    externalLabel: 'API přístup ve SuperFaktuře',
    settingsHref: '/settings/accounting#superfaktura',
  },
]

export const EXPORT_GUIDES: GuideLink[] = [
  {
    id: 'isdoc',
    title: 'ISDOC — univerzální formát',
    icon: '📄',
    summary: 'Standardní český formát elektronické faktury.',
    steps: [
      'Na detailu faktury klikněte „ISDOC (univerzální)“.',
      'Importujte soubor v Pohodě, Money S3, Helios nebo jiném ERP s podporou ISDOC.',
      'Export nevyužívá AI tokeny — můžete stahovat neomezeně.',
    ],
    settingsHref: '/faktury',
  },
  {
    id: 'pohoda',
    title: 'Pohoda — XML import',
    icon: '🟢',
    summary: 'Nativní XML pro Stormware Pohoda.',
    steps: [
      'Nastavte export profil: IČO vaší firmy (dataPack) v Nastavení → Export profil.',
      'Stáhněte „Pohoda XML“ z detailu faktury.',
      'V Pohodě: Soubor → Import → XML datové sady → vyberte stažený soubor.',
    ],
    settingsHref: '/settings/export#pohoda',
  },
  {
    id: 'money',
    title: 'Money S3',
    icon: '💰',
    summary: 'Dva formáty — ISDOC (doporučeno) nebo nativní XML.',
    steps: [
      'Doporučujeme „Money S3 — ISDOC“ — spolehlivější než nativní XML.',
      'V Money: Agenda Doklady → Import → ISDOC.',
      'Typ dokladu nastavte v export profilu (výchozí FP = faktura přijatá).',
    ],
    note: 'Nativní Money XML je best-effort bez XSD validace.',
    settingsHref: '/settings/export#money',
  },
  {
    id: 'helios',
    title: 'Helios Red / iNuvio',
    icon: '🔴',
    summary: 'CSV/ZIP pro Helios Red nebo XML pro Helios iNuvio.',
    steps: [
      'Helios Red: stáhněte ZIP s CSV soubory → import v Helios Red.',
      'Helios iNuvio: stáhněte XML → import dle dokumentace iNuvio.',
      'Středisko a zakázku nastavte v export profilu (STRED / STRED2).',
      'Helios Red podporuje pouze CZK faktury.',
    ],
    settingsHref: '/settings/export#helios',
  },
]

export const PRE_SEND_CHECKLIST = [
  'IČO a DIČ dodavatele odpovídají faktuře (kontrola ARES)',
  'Částka celkem a DPH sedí s řádky faktury',
  'Datum vystavení a splatnosti jsou správně',
  'Faktura není duplicitní (stejné číslo od stejného dodavatele)',
  'Účetní kód odpovídá typu nákladu',
]

export const COMMON_ISSUES = [
  {
    title: 'Fakturoid — free tarif',
    text: 'Free tarif neumožňuje vytvářet náklady přes API. Je potřeba placený tarif.',
  },
  {
    title: 'SuperFaktura — neúplný profil',
    text: 'Ve SuperFaktuře musí být vyplněný firemní profil včetně IČO, adresy a DIČ.',
  },
  {
    title: 'Pohoda / Money / Helios',
    text: 'Tyto systémy nemají cloudové API pro přijaté faktury — stáhněte export z detailu faktury a importujte v ERP.',
  },
]
