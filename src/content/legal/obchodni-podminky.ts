import { LEGAL_EMAIL, LEGAL_ENTITY_FULL, LEGAL_LAST_UPDATED } from '@/lib/legal'

export type LegalSection = {
  title: string
  paragraphs: string[]
}

export const OBCHODNI_PODMINKY: LegalSection[] = [
  {
    title: '1. Úvodní ustanovení a poskytovatel',
    paragraphs: [
      `Tyto obchodní podmínky (dále jen „Podmínky“) upravují smluvní vztah mezi ${LEGAL_ENTITY_FULL} (dále jen „Poskytovatel“) a fyzickou nebo právnickou osobou využívající online službu Faktury Audeflow (dále jen „Služba“), dostupnou na adrese faktury.audeflow.cz.`,
      'Služba je určena podnikatelům, OSVČ a účetním pracujícím v České republice. Poskytovatel není účetní firmou, daňovým poradcem ani advokátní kanceláří.',
      `Kontakt: ${LEGAL_EMAIL}. Poslední aktualizace Podmínek: ${LEGAL_LAST_UPDATED}.`,
    ],
  },
  {
    title: '2. Definice',
    paragraphs: [
      '„Uživatel“ — osoba, která si zřídila účet nebo Službu využívá.',
      '„Účet“ — uživatelský profil v Službě chráněný přihlašovacími údaji.',
      '„Obsah uživatele“ — PDF faktury, metadata, exportní soubory a další data nahraná nebo vytvořená Uživatelem.',
      '„Vytěžení“ — automatické načtení údajů z PDF pomocí algoritmů umělé inteligence včetně návrhu účetního kódu a předkontace.',
      '„Placený tarif“ — placené předplatné nebo jednorázový kredit faktur dle aktuálního ceníku.',
      '„Třetí systém“ — externí služba (iDoklad, Fakturoid, SuperFaktura, Pohoda, Money S3, Helios apod.) napojená Uživatelem.',
    ],
  },
  {
    title: '3. Uzavření smlouvy',
    paragraphs: [
      'Smlouva o poskytování Služby vzniká dokončením registrace, zaškrtnutím souhlasu s těmito Podmínkami a dokumentem Ochrana osobních údajů (GDPR), popř. zaplacením Placeného tarifu.',
      'Uživatel prohlašuje, že je starší 18 let, jedná způsobilým způsobem a — pokud jedná jménem firmy — je k tomu oprávněn.',
      'Poskytovatel může registraci odmítnout nebo účet pozastavit bez udání důvodu (zejména při podezření na zneužití, podvod nebo porušení Podmínek).',
    ],
  },
  {
    title: '4. Popis Služby a vyloučení odpovědnosti za výsledek',
    paragraphs: [
      'Služba umožňuje: nahrání nebo doručení PDF faktur (včetně e-mailového vstupu), automatické vytěžení, auditní kontroly, export souborů a odeslání dat do Třetích systémů dle nastavení Uživatele.',
      'Vytěžení je orientační návrh. Uživatel je povinen data před použitím v účetnictví, daních nebo vůči třetím osobám vždy samostatně zkontrolovat a případně opravit.',
      'Poskytovatel nezaručuje úplnost, správnost, aktuálnost ani právní/bezpečnostní soulad vytěžených údajů. Služba nenahrazuje odborné účetní, daňové ani právní posouzení.',
    ],
  },
  {
    title: '5. Digitální služba — okamžité plnění a odstoupení od smlouvy',
    paragraphs: [
      'Služba je digitální obsah / digitální služba poskytovaná distančním způsobem ve smyslu občanského zákoníku a souvisejících předpisů.',
      'Uživatel výslovně žádá o zahájení poskytování Služby okamžitě po registraci nebo zaplacení, před uplynutím 14denní lhůty pro odstoupení od smlouvy.',
      'Uživatel bere na vědomí, že dokončením registrace nebo zaplacením a zahájením využívání Služby (např. nahráním první faktury, čerpáním kreditu, stažením exportu) ztrácí právo odstoupit od smlouvy dle § 1837 písm. l) občanského zákoníku.',
    ],
  },
  {
    title: '6. Ceník, kredity, předplatné a platby',
    paragraphs: [
      'Aktuální ceník, limity bezplatného tarifu a podmínky Placených tarifů jsou uvedeny na webu Služby a v sekci Předplatné. Ceny jsou v Kč včetně DPH, není-li uvedeno jinak.',
      'Platby za Placené tarify zpracovává Stripe. Smlouva o platbě kartou vzniká mezi Uživatelem a Stripe; Poskytovatel neukládá údaje o platební kartě.',
      'Jednorázové kredity faktur se čerpají při zpracování faktury; po čerpání nezanikají nároky z již poskytnutého plnění. Předplatné se obnovuje automaticky, pokud Uživatel nezruší před datem obnovení ve správě předplatného (Stripe).',
      'Poskytovatel může ceník a rozsah tarifů změnit s předstihem nejméně 14 dnů zveřejněním na webu; změna se vztahuje na další fakturační období, nikoli retroaktivně.',
    ],
  },
  {
    title: '7. Zákaz vrácení peněz a storno plateb',
    paragraphs: [
      'Uživatel bere na vědomí a souhlasí, že na uhrazené poplatky za Placené tarify, kredity faktur a předplatné není nárok na vrácení peněz, storno ani poměrnou refundaci, a to ani při předčasném ukončení účtu, nevyužití Služby, změně názoru nebo nespokojenosti s kvalitou Vytěžení.',
      'Tím není dotčeno právo Uživatele na reklamaci technické vady Služby dle obecně závazných předpisů; oprávněná reklamace nezakládá automaticky nárok na vrácení peněz, pokud lze vadu odstranit, Služba byla v podstatné míře využita nebo plnění již proběhlo (zejména čerpání kreditu, export, odeslání do Třetího systému).',
      'Výjimku může Poskytovatel poskytnout pouze dle vlastního uvážení v případě prokazatelné duplicitní platby nebo závažné technické chyby výhradně na straně Poskytovatele.',
      'Chargebacky a neoprávněné storno platby kartou jsou považovány za porušení Podmínek; Poskytovatel může účet okamážitě zablokovat a vymáhat uhrazené poplatky.',
    ],
  },
  {
    title: '8. Reklamace',
    paragraphs: [
      `Reklamace technické funkčnosti Služby uplatněte e-mailem na ${LEGAL_EMAIL} s popisem vady a identifikací účtu. Poskytovatel potvrdí přijetí do 5 pracovních dnů a vyřídí reklamaci do 30 dnů.`,
      'Reklamace se nevztahuje na nesprávnost Vytěžení způsobenou kvalitou PDF, neúplným dokladem, specifickým formátem dodavatele nebo nesprávným nastavením Třetího systému Uživatele.',
    ],
  },
  {
    title: '9. Povinnosti a odpovědnost Uživatele',
    paragraphs: [
      'Uživatel odpovídá za správnost, zákonnost a oprávnění zpracovávat Obsah uživatele (včetně osobních údajů třetích osob na fakturách).',
      'Uživatel odpovídá za zabezpečení přihlašovacích údajů, API tokenů a přístupů k Třetím systémům. Veškerá aktivita pod účtem se považuje za aktivitu Uživatele.',
      'Uživatel je povinen zajistit, aby export nebo odeslání dat do účetnictví bylo v souladu s jeho vnitřními postupy a platnými předpisy.',
    ],
  },
  {
    title: '10. Zakázané jednání',
    paragraphs: [
      'Je zakázáno zejména: obcházet limity tarifu, automatizovaně scrapovat Službu, zatěžovat infrastrukturu, nahrávat malware, nelegální obsah, obsah porušující práva třetích osob nebo Službu využívat k podvodu.',
      'Poskytovatel může při porušení okamžitě pozastavit nebo ukončit účet bez náhrady a bez vrácení peněz.',
    ],
  },
  {
    title: '11. Třetí systémy a dostupnost',
    paragraphs: [
      'Napojení na Třetí systémy závisí na dostupnosti jejich API. Poskytovatel neodpovídá za výpadky, změny API, odmítnutí importu ani škody vzniklé v Třetím systému.',
      'Uživatel uzavírá smluvní vztah s provozovateli Třetích systémů samostatně; Podmínky se na ně nevztahují.',
    ],
  },
  {
    title: '12. Duševní vlastnictví',
    paragraphs: [
      'Software, design, značka a dokumentace Služby jsou majetkem Poskytovatele nebo jeho licencorů. Uživateli se uděluje nevýhradní, nepřenosné, časově omezené oprávnění Službu užívat pro vlastní podnikatelskou činnost.',
      'Obsah uživatele zůstává majetkem Uživatele. Uživatel uděluje Poskytovateli licenci k jeho zpracování v rozsahu nezbytném pro poskytování Služby.',
    ],
  },
  {
    title: '13. Omezení odpovědnosti Poskytovatele',
    paragraphs: [
      'Služba je poskytována „tak jak stojí a leží“ (as is) v mezích povolených právem. Poskytovatel vylučuje záruky obchodovatelnosti a vhodnosti pro konkrétní účel.',
      'Poskytovatel neodpovídá za ušlý zisk, ztrátu dat, sankce úřadů, chybné daňové nebo účetní zápisy, škody třetích osob ani nepřímé či následné škody.',
      'Celková odpovědnost Poskytovatele za jakoukoli škodu z titulu Služby v kalendářním roce je omezena částkou nejvýše rovnající se součtu poplatků uhrazených Uživatelem za posledních 12 měsíců, nebo 5 000 Kč — podle toho, která částka je nižší.',
      'Omezení odpovědnosti se nevztahuje na škodu způsobenou úmyslně nebo hrubou nedbalostí Poskytovatele, ani na případy, kdy je vyloučení odpovědnosti zakázáno kogentním právním předpisem.',
    ],
  },
  {
    title: '14. Force majeure',
    paragraphs: [
      'Poskytovatel neodpovídá za prodlení nebo nemožnost plnění způsobenou okolnostmi vylučujícími odpovědnost (výpadky internetu, hostingu, cloudových providerů, válka, přírodní katastrofa, opatření orgánů veřejné moci apod.).',
    ],
  },
  {
    title: '15. Ochrana osobních údajů',
    paragraphs: [
      'Zpracování osobních údajů se řídí samostatným dokumentem Ochrana osobních údajů (GDPR) dostupným na /gdpr.',
    ],
  },
  {
    title: '16. Změna Podmínek',
    paragraphs: [
      'Poskytovatel může Podmínky změnit. O podstatné změně informuje e-mailem nebo v Službě nejméně 14 dnů předem. Pokračováním v užívání Služby po účinnosti změny Uživatel se změnou souhlasí.',
    ],
  },
  {
    title: '17. Ukončení smlouvy',
    paragraphs: [
      'Uživatel může účet kdykoli ukončit zrušením předplatného a žádostí o smazání účtu na kontakt@audeflow.cz.',
      'Poskytovatel může smlouvu vypovědět s okamžitou účinností při porušení Podmínek, neplacení nebo nečinnosti účtu delší než 24 měsíců.',
      'Ukončením účtu nevzniká nárok na vrácení peněz za nevyčerpané období nebo kredity, není-li výslovně stanoveno jinak v těchto Podmínkách.',
    ],
  },
  {
    title: '18. Závěrečná ustanovení',
    paragraphs: [
      'Tyto Podmínky se řídí právem České republiky. K mimosoudnímu řešení sporů se strany obrátí nejprve na kontakt@audeflow.cz.',
      'Pokud Uživatel jedná jako podnikatel, jsou spory řešeny u věcně a místně příslušného soudu dle sídla Poskytovatele v České republice.',
      'Je-li některé ustanovení neplatné, ostatní ustanovení zůstávají v platnosti. Neplatné ustanovení nahradí ustanovení platné, které nejlépe odpovídá smyslu původního ustanovení.',
    ],
  },
]
