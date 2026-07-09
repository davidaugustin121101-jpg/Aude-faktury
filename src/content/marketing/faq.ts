export const MARKETING_FAQ = [
  {
    q: 'Kolik stojí vytěžení faktury v Audeflow?',
    a: 'Tarif Solo je zdarma — 10 faktur měsíčně. Standard: 100 faktur za 299 Kč jednorázově, tedy 2,99 Kč za fakturu. Kredit neexpiruje. Pro účetní firmy modul více klientů od 299 Kč/měsíc. Audeflow patří mezi nejlevnější řešení automatického vytěžení a exportu faktur na českém trhu.',
  },
  {
    q: 'Jak funguje vytěžení faktury v Audeflow?',
    a: 'Nahrajete PDF fakturu nebo ji pošlete e-mailem na @in.audeflow.cz. Systém načte dodavatele, IČO, DIČ, částky, sazbu DPH, VS, IBAN, položky faktury a typ dokladu. Navrhne český účetní kód a předkontaci MD/DAL. Poté exportujete soubor nebo odešlete do připojeného fakturačního systému.',
  },
  {
    q: 'Jak získám API přístup k iDokladu nebo Fakturoidu?',
    a: 'V nastavení Audeflow najdete podrobné návody. Obecně: iDoklad → Aplikace a služby → OAuth2; Fakturoid → Nastavení → API → nová integrace. Po propojení odešleme vytěženou fakturu včetně PDF přílohy a předkontace v poznámce.',
  },
  {
    q: 'Podporujete iDoklad, Fakturoid a SuperFakturu?',
    a: 'Ano — všechny tři cloudové systémy napojíme přímo přes API. Faktura se zapíše jako přijatý doklad nebo náklad včetně PDF přílohy, dodavatele z ARES a návrhu předkontace.',
  },
  {
    q: 'Podporujete BitFakturu a Súčto?',
    a: 'Ano. BitFaktura — vytvoříme výdajovou fakturu (income: 0) s položkami a DPH. Súčto — založíme přijatý doklad přes API s partnerem z ARES a řádky faktury.',
  },
  {
    q: 'Podporujete Pohodu, Money S3 a Helios?',
    a: 'Ano — stáhnete Pohoda XML, Money S3 XML/ISDOC nebo Helios CSV/XML a naimportujete ve svém ERP. Export obsahuje MD/DAL předkontaci připravenou pro české účetnictví.',
  },
  {
    q: 'Co je předkontace faktury a proč ji Audeflow navrhuje?',
    a: 'Předkontace je návrh účetního zápisu (MD/DAL) — např. 504/343/321 pro běžnou fakturu se 21% DPH. Audeflow navrhne účetní kód i kompletní předkontaci včetně zálohových faktur a daňových dokladů, ne jen surová data z PDF.',
  },
  {
    q: 'Mohu posílat faktury e-mailem?',
    a: 'Ano. Každý uživatel má unikátní adresu @in.audeflow.cz. PDF přílohy z e-mailu zpracujeme stejně jako upload — automatické vytěžení, audit a export.',
  },
  {
    q: 'Kontroluje Audeflow duplicitní faktury?',
    a: 'Ano. Před odesláním porovnáme IČO dodavatele, variabilní symbol, číslo faktury a částku. Pokud najdeme shodu, zobrazíme varování s odkazem na existující doklad.',
  },
  {
    q: 'Funguje vytěžení zálohových faktur a daňových dokladů?',
    a: 'Ano. Rozpoznáme typ dokladu — zálohová faktura, daňový doklad k záloze, běžná faktura nebo dobropis — a navrhneme odpovídající předkontaci.',
  },
  {
    q: 'Vytěží Audeflow položky faktury?',
    a: 'Ano. Načteme jednotlivé řádky faktury včetně názvu, množství, ceny a DPH. U smíšených faktur navrhneme split předkontace pro více účetních kódů.',
  },
  {
    q: 'Je Audeflow vhodný pro účetní firmy?',
    a: 'Ano. Režim pro více klientů umožňuje spravovat samostatné workspace a napojení na fakturační systém pro každého klienta — iDoklad, Fakturoid, SuperFaktura, BitFaktura nebo Súčto.',
  },
  {
    q: 'Funguje aplikace na mobilu?',
    a: 'Ano. Audeflow je plně responzivní — faktury nahráváte, kontrolujete a exportujete přímo z telefonu nebo tabletu.',
  },
  {
    q: 'Jak rychle se faktura dostane do účetnictví?',
    a: 'Typicky do minuty — upload nebo e-mail, automatické vytěžení, kontrola a jedno kliknutí na odeslání do API nebo stažení exportu pro Pohodu, Money S3 či Helios.',
  },
  {
    q: 'Proč je Audeflow levnější než konkurence?',
    a: 'Platíte jen za zpracované faktury — od 2,99 Kč kus, bez drahého měsíčního předplatného u Standard tarifu. 10 faktur měsíčně zdarma pro Solo. Žádné skryté poplatky za API napojení.',
  },
] as const
