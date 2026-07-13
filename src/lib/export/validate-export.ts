import type { ExportFormat, ExportProfile, ExportValidationResult, NormalizedInvoice } from './types'

const MATH_TOLERANCE = 0.02

function mathOk(inv: NormalizedInvoice): boolean {
  const sum = inv.castkaBezDph + inv.castkaDph
  return Math.abs(sum - inv.castkaCelkem) <= MATH_TOLERANCE
}

function commonValidation(
  inv: NormalizedInvoice,
  forceExport: boolean
): ExportValidationResult {
  const errors: ExportValidationResult['errors'] = []
  const warnings: ExportValidationResult['warnings'] = []

  if (!inv.dodavatelNazev) {
    errors.push({ code: 'missing_supplier', field: 'dodavatel_nazev', message: 'Chybí název dodavatele' })
  }
  if (!inv.dodavatelIco || inv.dodavatelIco.length < 8) {
    errors.push({ code: 'missing_ico', field: 'dodavatel_ico', message: 'Chybí nebo neplatné IČO dodavatele' })
  }
  if (!inv.cisloFaktury) {
    errors.push({ code: 'missing_number', field: 'cislo_faktury', message: 'Chybí číslo faktury' })
  }
  if (!inv.datumVystaveni) {
    errors.push({ code: 'missing_issue_date', field: 'datum_vystaveni', message: 'Chybí datum vystavení' })
  }
  if (inv.castkaCelkem <= 0) {
    errors.push({ code: 'invalid_total', field: 'castka_celkem', message: 'Celková částka musí být kladná' })
  }
  if (!mathOk(inv)) {
    errors.push({
      code: 'math_mismatch',
      message: `Součet základu a DPH (${(inv.castkaBezDph + inv.castkaDph).toFixed(2)}) neodpovídá celku (${inv.castkaCelkem.toFixed(2)})`,
    })
  }

  if (inv.auditResult?.hasCritical && !forceExport) {
    errors.push({
      code: 'critical_audit',
      message: 'Faktura má kritické chyby auditu. Export blokován — opravte data nebo použijte force=1.',
    })
  }

  return { ok: errors.length === 0, errors, warnings }
}

function pohodaValidation(
  inv: NormalizedInvoice,
  result: ExportValidationResult,
  profile?: ExportProfile
): ExportValidationResult {
  const errors = [...result.errors]
  const warnings = [...result.warnings]

  const companyIco = (profile?.companyIco ?? '').replace(/\D/g, '')
  if (companyIco.length < 8) {
    errors.push({
      code: 'missing_company_ico',
      message:
        'Pro import do Pohody vyplňte IČO vaší firmy v Nastavení → Export profil (atribut dataPack ico).',
    })
  }

  if (!inv.ucetniKod) {
    warnings.push({ code: 'missing_account_code', message: 'Chybí účetní kód — bude použito 518' })
  }

  return { ok: errors.length === 0, errors, warnings }
}

function isdocValidation(inv: NormalizedInvoice, result: ExportValidationResult): ExportValidationResult {
  const errors = [...result.errors]
  const warnings = [...result.warnings]

  if (!['CZK', 'EUR', 'USD'].includes(inv.mena)) {
    warnings.push({ code: 'currency_unusual', message: `Měna ${inv.mena} — ověřte import v cílovém systému` })
  }
  return { ok: errors.length === 0, errors, warnings }
}

function heliosRedValidation(inv: NormalizedInvoice, result: ExportValidationResult): ExportValidationResult {
  const errors = [...result.errors]
  const warnings = [...result.warnings]

  if (inv.mena !== 'CZK') {
    errors.push({ code: 'helios_currency', message: 'Helios Red export vyžaduje měnu CZK' })
  }
  if (inv.dodavatelNazev.length > 200) {
    warnings.push({ code: 'text_truncated', message: 'Text dodavatele může být v CSV zkrácen' })
  }

  return { ok: errors.length === 0, errors, warnings }
}

function moneyNativeValidation(inv: NormalizedInvoice, result: ExportValidationResult): ExportValidationResult {
  const warnings = [...result.warnings]
  warnings.push({
    code: 'money_native_best_effort',
    message: 'Nativní Money XML je generováno bez XSD validace — doporučujeme nejdřív ISDOC.',
  })
  return { ...result, warnings }
}

export function validateForExport(
  inv: NormalizedInvoice,
  format: ExportFormat,
  options: { forceExport?: boolean; profile?: ExportProfile } = {}
): ExportValidationResult {
  let result = commonValidation(inv, options.forceExport ?? false)

  switch (format) {
    case 'pohoda':
      result = pohodaValidation(inv, result, options.profile)
      break
    case 'isdoc':
    case 'money_isdoc':
      result = isdocValidation(inv, result)
      break
    case 'helios_red':
      result = heliosRedValidation(inv, result)
      break
    case 'money_native':
      result = moneyNativeValidation(inv, result)
      break
    case 'helios_inuvio':
      result = pohodaValidation(inv, result, options.profile)
      break
  }

  return result
}
