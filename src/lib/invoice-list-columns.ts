/** Sloupce pro seznam faktur — bez raw_extraction a audit_result (těžká JSON pole). */
export const INVOICE_LIST_SELECT =
  'id, user_id, workspace_id, dodavatel_nazev, dodavatel_ico, cislo_faktury, datum_vystaveni, datum_splatnosti, castka_bez_dph, castka_dph, castka_celkem, mena, confidence, problemy, status, ucetni_kod, created_at'
