/** Rozparsuje české číslo účtu ve tvaru 123456789/0100 nebo 1234567891/0321 */
export function parseCzechBankAccount(raw: string | null | undefined): {
  accountNumber: string | null
  bankCode: string | null
} {
  const s = (raw ?? '').trim().replace(/\s/g, '')
  if (!s) return { accountNumber: null, bankCode: null }

  const slash = s.match(/^(\d+)\/(\d{4})$/)
  if (slash) {
    return { accountNumber: slash[1], bankCode: slash[2] }
  }

  return { accountNumber: s, bankCode: null }
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
  const bankCode = (input.kod_banky ?? '').trim() || parsed.bankCode
  return {
    accountNumber: parsed.accountNumber,
    bankCode: bankCode || null,
    iban: normalizeIban(input.iban),
    swift: normalizeSwift(input.swift),
  }
}
