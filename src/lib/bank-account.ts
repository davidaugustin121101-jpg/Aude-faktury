/** Rozparsuje české číslo účtu ve tvaru 123456789/0100 nebo 1234567891/0321 */
export function normalizeBankCode(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (!digits) return null
  return digits.padStart(4, '0').slice(-4)
}

export function parseCzechBankAccount(raw: string | null | undefined): {
  accountNumber: string | null
  bankCode: string | null
} {
  const s = (raw ?? '').trim().replace(/\s/g, '')
  if (!s) return { accountNumber: null, bankCode: null }

  const slashWithCode = s.match(/^(\d{1,16})\/(\d{1,4})$/)
  if (slashWithCode) {
    return {
      accountNumber: slashWithCode[1],
      bankCode: normalizeBankCode(slashWithCode[2]),
    }
  }

  const slashOnly = s.match(/^(\d{1,16})\/$/)
  if (slashOnly) {
    return { accountNumber: slashOnly[1], bankCode: null }
  }

  const digitsOnly = s.match(/^(\d+)$/)
  if (digitsOnly) {
    return { accountNumber: digitsOnly[1], bankCode: null }
  }

  const cleaned = s.replace(/\/$/, '')
  return { accountNumber: cleaned || null, bankCode: null }
}

/** iDoklad AccountNumber smí obsahovat pouze číslice */
export function sanitizeIdokladAccountNumber(
  accountNumber: string | null | undefined
): string | undefined {
  const digits = (accountNumber ?? '').replace(/\D/g, '')
  return digits || undefined
}

export function normalizeIban(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim().replace(/\s/g, '').toUpperCase()
  return s || null
}

export function normalizeSwift(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim().replace(/\s/g, '').toUpperCase()
  return s || null
}

export type ParsedBankPayment = {
  accountNumber: string | null
  bankCode: string | null
  iban: string | null
  swift: string | null
}

/** Sjednocené bankovní údaje z extrakce (číslo účtu, kód banky, IBAN, SWIFT) */
export function parseBankPaymentFields(input: {
  cislo_uctu?: string | null
  kod_banky?: string | null
  iban?: string | null
  swift?: string | null
}): ParsedBankPayment {
  const parsed = parseCzechBankAccount(input.cislo_uctu)
  const bankCode = normalizeBankCode(input.kod_banky) || parsed.bankCode
  const accountNumber = parsed.accountNumber?.replace(/\/$/, '') || null
  return {
    accountNumber,
    bankCode: bankCode || null,
    iban: normalizeIban(input.iban),
    swift: normalizeSwift(input.swift),
  }
}
