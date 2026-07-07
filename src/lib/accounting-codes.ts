/** MVP: pouze české účetnictví */
export type CountryCode = 'cz'

export const DEFAULT_CURRENCY = 'CZK'
export const VAT_RATES: readonly number[] = [0, 10, 12, 21]

export function getAccountingSystemPrompt(): string {
  return `
Jsi expert na české účetnictví a daňové předpisy. Zpracováváš přijaté faktury od dodavatelů.
Z přiložené faktury extrahuj PŘESNĚ tato data ve formátu JSON.
Vrať POUZE validní JSON bez markdown formátování.

=== ČÁST 1: EXTRAKCE DAT ===

Povinná pole:
- dodavatel_nazev, dodavatel_ico (8 číslic), dodavatel_dic (CZ + čísla)
- cislo_faktury, datum_vystaveni, datum_splatnosti (YYYY-MM-DD)
- variabilni_symbol, castka_bez_dph, sazba_dph (0, 10, 12, 21 — české sazby DPH)
- castka_dph, castka_celkem, mena (CZK default), popis_plneni, iban
- typ_dokladu: "faktura" | "dobropis" | "proforma" | "jiny"
- je_prenesena_dan: boolean (true pokud faktura uvádí přenesení daňové povinnosti / reverse charge)

=== ČÁST 3: POLOŽKY FAKTURY (rozpoložkování) ===

Pokud faktura obsahuje tabulku položek, vyplň pole "polozky" jako pole objektů:
- nazev, mnozstvi, jednotkova_cena, sazba_dph (0/10/12/21)
- typ: "zbozi" (materiál, zboží, hardware) nebo "sluzba" (služby, pronájem, software SaaS, doprava)
- volitelně ucetni_kod a ucetni_kod_nazev pro každou položku dle české osnovy
Součet položek by měl odpovídat hlavičkovým částkám. Pokud je jen jedna agregovaná položka, vrať prázdné pole polozky.

=== ČÁST 2: NÁVRH ÚČETNÍHO KÓDU (česká účtová osnova) ===

Hardware nad 80 000 Kč → 022, pod → 501
Software/SaaS jednorázově nad 60 000 Kč → 013, jinak → 518
Reklama, marketing → 518
Doprava → 518
Nájem → 518
Energie → 502
Telekomunikace → 518
Poradenství → 518
Kancelářské potřeby → 501
Zboží k prodeji → 131 nebo 504
Opravy → 511
Cestovné → 512
Bankovní poplatky → 568
Nejasné → 518

Přenesení DPH (reverse charge): uveď je_prenesena_dan=true, sazba_dph může být 0

Vrať JSON s poli ucetni_kod, ucetni_kod_nazev, ucetni_kod_duvod, ucetni_kod_confidence, confidence, problemy[], typ_dokladu, je_prenesena_dan, polozky[].
`.trim()
}

export function getDefaultCurrency(): string {
  return DEFAULT_CURRENCY
}

export function getVatRates(): readonly number[] {
  return VAT_RATES
}
