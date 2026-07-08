export const MARKETING_FAQ = [
  {
    q: 'Jak získám API přístup k iDokladu nebo Fakturoidu?',
    a: 'V nastavení Audeflow najdete podrobné návody. Obecně: iDoklad → Aplikace a služby → OAuth2; Fakturoid → Nastavení → API → nová integrace.',
  },
  {
    q: 'Podporujete Pohodu, Money S3 a Helios?',
    a: 'Ano — stáhnete ISDOC, Pohoda XML, Money S3 nebo Helios CSV/XML a naimportujete ve svém programu. Cloudové systémy (iDoklad, Fakturoid, SuperFaktura) napojíme přímo přes API.',
  },
  {
    q: 'Mohu posílat faktury e-mailem?',
    a: 'Ano. Každý uživatel má unikátní adresu @in.audeflow.cz. PDF přílohy z e-mailu zpracujeme stejně jako upload.',
  },
  {
    q: 'Funguje aplikace na mobilu?',
    a: 'Ano. Audeflow je plně responzivní — faktury nahráváte, kontrolujete a exportujete přímo z telefonu.',
  },
  {
    q: 'Jak funguje vytěžení faktury v Audeflow?',
    a: 'Nahrajete PDF fakturu nebo ji pošlete e-mailem, systém načte dodavatele, IČO, částky, DPH a navrhne účetní kód včetně předkontace. Poté exportujete soubor nebo odešlete do připojeného fakturačního systému.',
  },
  {
    q: 'Je Audeflow vhodný pro účetní firmy?',
    a: 'Ano. Režim pro více klientů umožňuje spravovat samostatné workspace a napojení na fakturační systém pro každého klienta.',
  },
] as const
