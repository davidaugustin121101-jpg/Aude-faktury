export type LandingReview = {
  name: string
  role: string
  quote: string
  highlight: string
}

export const LANDING_REVIEWS: LandingReview[] = [
  {
    name: 'Lucie Horáková',
    role: 'OSVČ · IT konzultantka',
    highlight: 'E-mailový vstup',
    quote:
      'Faktury od dodavatelů přeposílám na @in.audeflow.cz a za chvíli je mám zkontrolované. Ušetřím si ruční přepisování do Fakturoidu — hlavně u opakujících se dodavatelů.',
  },
  {
    name: 'Martin Pokorný',
    role: 'Vedoucí účetní · účetní kancelář',
    highlight: 'Více klientů',
    quote:
      'Přepínám mezi klienty na iDokladu i SuperFaktuře bez přihlašování do pěti systémů. Předkontace je rovnou v poznámce, takže kontrola před odesláním trvá minuty, ne hodiny.',
  },
  {
    name: 'Jana Černá',
    role: 'Majitelka · malá výroba',
    highlight: 'Předkontace',
    quote:
      'Nejvíc oceňuju návrh účetního zápisu — ne jen částky z PDF. Po nahrání projdu audit, jednou kliknu a faktura je v Pohodě. Dřív jsem to řešila s účetní až na konci měsíce.',
  },
  {
    name: 'Tomáš Beneš',
    role: 'Finanční specialista · obchodní firma',
    highlight: 'Rychlost vytěžení',
    quote:
      'Stahuju desítky faktur týdně. Audeflow je výrazně rychlejší než ruční zadávání a cena za kus je nízká. Kontrola duplicit mě už několikrát zachránila před dvojím zaúčtováním.',
  },
  {
    name: 'Petra Nováková',
    role: 'Asistentka jednatele · služby',
    highlight: 'Export do Helios',
    quote:
      'Nahraju PDF, zkontroluju IČO a částky, stáhnu CSV pro Helios a hotovo. Nemusím čekat na externího účetního kvůli každé přijaté faktuře — export je přímočařý.',
  },
]

export const LANDING_REVIEWS_TRUST_LINE = 'Již 50+ klientů důvěřuje Audeflow'
