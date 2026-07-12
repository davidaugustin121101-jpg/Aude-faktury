/** MVP: pouze české účetnictví */
export type CountryCode = 'cz'

export const DEFAULT_CURRENCY = 'CZK'
export const VAT_RATES: readonly number[] = [0, 10, 12, 21]

export function getAccountingSystemPrompt(): string {
  return `
Jsi expert na české faktury a DPH. Z přiložené faktury extrahuj PŘESNĚ tato data.
Účetní kódy (předkontace) NEŘEŠ — ty doplní systém automaticky po extrakci.

=== EXTRAKCE DAT ===

Povinná pole:
- dodavatel_nazev, dodavatel_ico (8 číslic), dodavatel_dic (CZ + čísla)
- cislo_faktury, datum_vystaveni, datum_splatnosti (YYYY-MM-DD)
- variabilni_symbol, castka_bez_dph, sazba_dph (0, 10, 12, 21)
- castka_dph, castka_celkem, mena (CZK default), popis_plneni
- cislo_uctu: číslo/kód banky (např. 1234567891/0321), null pokud chybí
- kod_banky, iban, swift, konstantni_symbol, cislo_objednavky — null pokud chybí
- typ_dokladu: "faktura" | "dobropis" | "proforma" | "jiny"
- typ_faktury: "zalohova" | "danovy_doklad"
- castka_k_uhrade: zbývá uhradit (0 pokud záloha pokryla plnění)
- datum_duzp: YYYY-MM-DD nebo null
- je_prenesena_dan: boolean (reverse charge)
- confidence: 0–1, problemy[]: seznam upozornění

=== ZÁLOHOVÁ vs. DAŇOVÁ FAKTURA ===

typ_faktury = "zalohova": titulek záloha/proforma, chybí DUZP nebo jde o požadavek platby před dodáním.
typ_faktury = "danovy_doklad": finální faktura, DUZP, rozpis DPH.

U vyúčtování zálohy (castka_k_uhrade = 0): castka_bez_dph/castka_dph/castka_celkem ber z rozpisu plnění, ne z řádku „k úhradě 0 Kč“.
Do problemy[] uveď „Vyúčtování zálohy — ověřte párování se zálohovou fakturou“ pokud je castka_k_uhrade 0.

=== POLOŽKY FAKTURY ===

Pokud faktura má tabulku položek, vyplň polozky[] — každý řádek = jeden objekt:
nazev, mnozstvi, jednotkova_cena, sazba_dph, typ ("zbozi"|"sluzba"), jednotka (volitelně).
NIKDY neslučuj řádky tabulky. popis_plneni je jen krátký souhrn.
polozky nech prázdné jen pokud faktura nemá tabulku (jedna souhrnná částka).
`.trim()
}

export function getDefaultCurrency(): string {
  return DEFAULT_CURRENCY
}

export function getVatRates(): readonly number[] {
  return VAT_RATES
}
