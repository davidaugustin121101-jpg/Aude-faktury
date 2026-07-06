export type LegalSection = {
  title: string
  paragraphs: string[]
}

export const OBCHODNI_PODMINKY: LegalSection[] = [
  {
    title: '1. Poskytovatel a předmět služby',
    paragraphs: [
      'Poskytovatelem online služby Faktury Audeflow (dále jen „Služba“) je AUDE FLOW, fyzická osoba podnikající, IČO 10841067 (dále jen „Poskytovatel“).',
      'Služba umožňuje nahrání PDF faktur, automatické vytěžení údajů pomocí umělé inteligence, kontrolu dat a export nebo odeslání do fakturačního / účetního systému uživatele.',
    ],
  },
  {
    title: '2. Uzavření smlouvy',
    paragraphs: [
      'Smlouva mezi uživatelem a Poskytovatelem vzniká dokončením registrace a zaškrtnutím souhlasu s těmito obchodními podmínkami.',
      'Uživatel prohlašuje, že je starší 18 let a jedná v rámci podnikatelské činnosti nebo na vlastní odpovědnost.',
    ],
  },
  {
    title: '3. Digitální služba a okamžité plnění',
    paragraphs: [
      'Služba je digitální obsah poskytovaný distančním způsobem. Po registraci nebo zaplacení předplatného je Služba zpřístupněna okamžitě.',
      'Uživatel výslovně souhlasí se zahájením poskytování Služby před uplynutím lhůty pro odstoupení od smlouvy a bere na vědomí, že tím ztrácí právo odstoupit od smlouvy dle § 1837 písm. l) občanského zákoníku, pokud by jinak náleželo.',
    ],
  },
  {
    title: '4. Ceny, předplatné a platby',
    paragraphs: [
      'Aktuální ceník je uveden na webu Služby a v sekci Předplatné. Platby za placené tarify probíhají prostřednictvím Stripe.',
      'Předplatné se automaticky obnovuje na další fakturační období, pokud uživatel nezruší předplatné před datem obnovení.',
      'Poskytovatel si vyhrazuje právo změnit ceník s předstihem nejméně 14 dnů; změna se vztahuje na další fakturační období.',
    ],
  },
  {
    title: '5. Zákaz vrácení peněz',
    paragraphs: [
      'Uživatel bere na vědomí, že po započetí fakturačního období, využití kreditu na vytěžení faktury nebo stažení exportu není nárok na vrácení peněz.',
      'Reklamace technických vad Služby lze uplatnit e-mailem na kontakt@audeflow.cz; Poskytovatel ji vyřídí do 30 dnů. Oprávněná reklamace nezakládá automaticky nárok na vrácení peněz, pokud lze vadu odstranit nebo Služba byla v podstatné míře využita.',
      'V případě duplicitní platby nebo prokazatelné technické chyby na straně Poskytovatele může Poskytovatel vrátit částku dle vlastního uvážení.',
    ],
  },
  {
    title: '6. Povinnosti uživatele',
    paragraphs: [
      'Uživatel je povinen před exportem nebo odesláním faktury zkontrolovat vytěžené údaje. Poskytovatel neodpovídá za daňovou, účetní ani právní správnost dat zpracovaných ve fakturačním systému uživatele.',
      'Uživatel odpovídá za zabezpečení přístupových údajů ke svému účtu a za API klíče třetích stran zadané do Služby.',
      'Uživatel nesmí Službu zneužívat (automatizované scraping, přetěžování, obcházení limitů, nelegální obsah).',
    ],
  },
  {
    title: '7. Omezení odpovědnosti',
    paragraphs: [
      'Vytěžení faktur probíhá pomocí AI a Poskytovatel nezaručuje 100% správnost extrahovaných údajů.',
      'Poskytovatel neodpovídá za výpadky třetích stran (iDoklad, Fakturoid, SuperFaktura, Stripe, Supabase apod.).',
      'Celková odpovědnost Poskytovatele za škodu vzniklou v souvislosti se Službou je omezena částkou rovnající se se součtem poplatků uhrazených uživatelem za posledních 12 měsíců, nejvýše však 5 000 Kč.',
    ],
  },
  {
    title: '8. Ukončení',
    paragraphs: [
      'Uživatel může účet kdykoli zrušit kontaktováním podpory nebo zrušením předplatného ve Stripe.',
      'Poskytovatel může účet pozastavit nebo ukončit při porušení těchto podmínek, neplacení nebo zneužití Služby.',
    ],
  },
  {
    title: '9. Duševní vlastnictví',
    paragraphs: [
      'Software, design a obsah Služby jsou majetkem Poskytovatele. Uživateli je udělena nevýhradní licence k užívání Služby po dobu trvání smlouvy.',
    ],
  },
  {
    title: '10. Ochrana údajů',
    paragraphs: [
      'Zpracování osobních údajů se řídí dokumentem Ochrana osobních údajů dostupným na /ochrana-udaju.',
    ],
  },
  {
    title: '11. Závěrečná ustanovení',
    paragraphs: [
      'Tyto podmínky se řídí právem České republiky. Případné spory budou řešeny u příslušného soudu dle sídla Poskytovatele.',
      'Kontakt: kontakt@audeflow.cz. Poslední aktualizace: červen 2026.',
    ],
  },
]
