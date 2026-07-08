import {
  LEGAL_EMAIL,
  LEGAL_ENTITY_FULL,
  LEGAL_LAST_UPDATED,
} from '@/lib/legal'

export type LegalSection = {
  title: string
  paragraphs: string[]
}

export const OCHRANA_UDAJU: LegalSection[] = [
  {
    title: '1. Správce osobních údajů',
    paragraphs: [
      `Správcem osobních údajů ve smyslu nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR) je ${LEGAL_ENTITY_FULL} (dále jen „Správce“).`,
      `Kontakt pro záležitosti ochrany osobních údajů: ${LEGAL_EMAIL}.`,
      `Poslední aktualizace tohoto dokumentu: ${LEGAL_LAST_UPDATED}.`,
      'Správce není povinen jmenovat pověřence pro ochranu osobních údajů (DPO) dle čl. 37 GDPR; veškeré dotazy směřujte na uvedený kontakt.',
    ],
  },
  {
    title: '2. Rozsah a kategorie zpracovávaných údajů',
    paragraphs: [
      'Identifikační a kontaktní údaje: jméno, e-mail, název firmy, IČO, telefon (pokud uvedete).',
      'Údaje o účtu: přihlašovací e-mail, hash hesla, nastavení Služby, historie předplatného a kreditů.',
      'Fakturační a platební údaje: fakturační adresa, DIČ; údaje o platbách zpracovává Stripe (Správce neukládá čísla platebních karet).',
      'Obsah faktur: údaje z PDF a e-mailů (dodavatel, odběratel, částky, IČO, VS, položky, metadata) včetně případných osobních údajů třetích osob uvedených na fakturách.',
      'Technické údaje: IP adresa, logy, cookies nezbytné pro provoz a analytiku (viz níže).',
      'Komunikace: obsah e-mailů se Správcem a doručených faktur na adresu @in.audeflow.cz.',
    ],
  },
  {
    title: '3. Zdroje údajů',
    paragraphs: [
      'Údaje poskytuje přímo subjekt údajů (registrace, nastavení, nahrání PDF).',
      'Údaje z faktur pocházejí z dokumentů nahraných Uživatelem nebo zaslaných na e-mailový vstup Služby.',
      'Platební údaje poskytuje Stripe v rozsahu potvrzení platby.',
    ],
  },
  {
    title: '4. Účely a právní základy zpracování',
    paragraphs: [
      'Poskytování Služby, správa účtu, zpracování faktur, export a integrace — plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR).',
      'Platby a účetnictví Správce — plnění smlouvy a právní povinnost (čl. 6 odst. 1 písm. b), c) GDPR).',
      'Bezpečnost, prevence zneužití, logy — oprávněný zájem Správce (čl. 6 odst. 1 písm. f) GDPR).',
      'Marketingová komunikace — pouze se souhlasem (čl. 6 odst. 1 písm. a) GDPR); souhlas lze kdykoli odvolat.',
      'Vytěžení faktur pomocí AI — plnění smlouvy; subjekt údajů je odpovědný za to, že má právní titul ke zpracování údajů na fakturách třetích osob.',
    ],
  },
  {
    title: '5. Příjemci a zpracovatelé',
    paragraphs: [
      'Osobní údaje mohou být zpřístupněny těmto kategoriím příjemců (zpracovatelů), kteří zpracovávají údaje jménem Správce na základě smlouvy o zpracování:',
      '• Vercel Inc. — hosting aplikace a infrastruktura.',
      '• Supabase Inc. — databáze, autentizace, úložiště souborů.',
      '• Stripe Inc. — platební brána.',
      '• Anthropic PBC — zpracování textu/PDF pro automatické vytěžení (AI).',
      '• Resend Inc. — doručování transakčních e-mailů a příjem inbound e-mailů s fakturami.',
      'Údaje nejsou prodávány třetím stranám pro marketingové účely. Orgány veřejné moci obdrží údaje pouze v rozsahu stanoveném zákonem.',
    ],
  },
  {
    title: '6. Předávání do třetích zemí',
    paragraphs: [
      'Někteří zpracovatelé (zejména v USA) mohou zpracovávat údaje mimo Evropský hospodářský prostor. Předávání probíhá na základě rozhodnutí o odpovídající ochraně, standardních smluvních doložek (SCC) schválených Evropskou komisí nebo jiných vhodných záruk dle kap. V GDPR.',
      'Podrobnosti o zárukách u jednotlivých zpracovatelů lze vyžádat na kontakt@audeflow.cz.',
    ],
  },
  {
    title: '7. Doba uchovávání',
    paragraphs: [
      'Údaje účtu a faktur: po dobu trvání smlouvy a nejdéle 30 dnů po smazání účtu (zálohy dle technických postupů do 90 dnů), pokud delší uchování nevyžaduje zákon (účetnictví Správce).',
      'Fakturační doklady Správce: dle zákona o účetnictví a DPH, typicky 5–10 let.',
      'Bezpečnostní logy: obvykle do 12 měsíců.',
      'Po uplynutí doby uchovávání jsou údaje smazány nebo anonymizovány.',
    ],
  },
  {
    title: '8. Automatizované zpracování a AI',
    paragraphs: [
      'Služba používá automatizované zpracování (včetně AI) k návrhu údajů z faktur. Výsledek není právně závazné rozhodnutí ve smyslu čl. 22 GDPR; Uživatel vždy provádí finální kontrolu.',
      'Správce neprovádí profilování subjektů údajů pro marketing bez souhlasu.',
    ],
  },
  {
    title: '9. Zabezpečení',
    paragraphs: [
      'Správce přijal přiměřená technická a organizační opatření: šifrované připojení (HTTPS/TLS), hash hesel, řízení přístupu, izolace dat mezi účty, pravidelné aktualizace.',
      'Přesto nelze zaručit absolutní bezpečnost přenosu dat internetem; Uživatel by neměl do Služby ukládat data, která nepotřebuje.',
    ],
  },
  {
    title: '10. Práva subjektů údajů',
    paragraphs: [
      'Máte právo na: přístup k údajům, opravu, výmaz („právo být zapomenut“), omezení zpracování, přenositelnost (pokud se uplatní), námitku proti zpracování na základě oprávněného zájmu a odvolání souhlasu.',
      'Žádosti zasílejte na kontakt@audeflow.cz; odpovíme do 30 dnů. V odůvodněných případech můžeme požádat o ověření totožnosti.',
      'Máte právo podat stížnost u Úřadu pro ochranu osobních údajů (www.uoou.cz), Pplk. Sochora 27, 170 00 Praha 7.',
    ],
  },
  {
    title: '11. Cookies a analytika',
    paragraphs: [
      'Služba používá nezbytné cookies pro přihlášení a bezpečnost session.',
      'Analytické cookies (Vercel Analytics) slouží k agregovanému měření návštěvnosti bez identifikace konkrétní osoby; lze je blokovat nastavením prohlížeče.',
      'Podrobnější informace o cookies lze doplnit v samostatné cookie liště, pokud bude na webu aktivována.',
    ],
  },
  {
    title: '12. Údaje dětí',
    paragraphs: [
      'Služba není určena osobám mladším 18 let. Vědomě nesbíráme údaje dětí; zjistíme-li takový případ, údaje smažeme.',
    ],
  },
  {
    title: '13. Změny dokumentu',
    paragraphs: [
      'Správce může tento dokument aktualizovat. O podstatných změnách informuje v Službě nebo e-mailem. Aktuální verze je vždy na /gdpr.',
    ],
  },
]
