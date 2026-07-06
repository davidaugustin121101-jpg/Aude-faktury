import type { LegalSection } from './obchodni-podminky'

export const OCHRANA_UDAJU: LegalSection[] = [
  {
    title: '1. Správce',
    paragraphs: [
      'Správcem osobních údajů je AUDE FLOW, fyzická osoba podnikající, IČO 10841067, kontakt: kontakt@audeflow.cz.',
    ],
  },
  {
    title: '2. Jaké údaje zpracováváme',
    paragraphs: [
      'Registrační údaje (e-mail, heslo v hashované podobě), nastavení účtu (země, tarif), metadata o fakturách a obsah nahraných PDF pro účely vytěžení.',
      'Platební údaje zpracovává Stripe; my neukládáme čísla platebních karet.',
      'API přihlašovací údaje k fakturačním systémům ukládáme šifrovaně (Supabase Vault).',
    ],
  },
  {
    title: '3. Účel a právní základ',
    paragraphs: [
      'Plnění smlouvy (poskytování Služby), oprávněný zájem (bezpečnost, prevence zneužití) a plnění právních povinností (účetnictví, daně).',
    ],
  },
  {
    title: '4. Doba uchování',
    paragraphs: [
      'Údaje uchováváme po dobu trvání účtu a nejdéle 3 roky po jeho ukončení, pokud zákon nevyžaduje delší dobu.',
      'Nahrané faktury lze uživatel smazat v aplikaci; po smazání jsou odstraněny z aktivní databáze.',
    ],
  },
  {
    title: '5. Příjemci a předávání',
    paragraphs: [
      'Údaje mohou být zpracovány poskytovateli hostingu (Vercel), databáze (Supabase), plateb (Stripe), AI extrakce (Anthropic) a zvoleného fakturačního systému uživatele.',
      'Někteří zpracovatelé mohou být mimo EU; předávání probíhá na základě standardních smluvních doložek.',
    ],
  },
  {
    title: '6. Vaše práva',
    paragraphs: [
      'Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost a vznést námitku. Žádosti směřujte na kontakt@audeflow.cz.',
      'Stížnost lze podat u Úřadu pro ochranu osobních údajů (uoou.cz).',
    ],
  },
]
