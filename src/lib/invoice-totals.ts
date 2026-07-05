type InvoiceAmountRow = {
  castka_celkem?: number | null
  castka_dph?: number | null
  castka_bez_dph?: number | null
  mena?: string | null
  status?: string | null
}

export function formatMoney(
  amount: number | null | undefined,
  currency = 'CZK'
): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function sumInvoiceAmounts(
  rows: InvoiceAmountRow[],
  options?: { approvedOnly?: boolean }
) {
  let total = 0
  let vat = 0
  let base = 0
  let count = 0

  for (const row of rows) {
    if (options?.approvedOnly && row.status && !['sent_to_accounting', 'sent', 'approved'].includes(row.status)) {
      continue
    }
    count += 1
    total += Number(row.castka_celkem ?? 0)
    vat += Number(row.castka_dph ?? 0)
    base += Number(row.castka_bez_dph ?? 0)
  }

  return { total, vat, base, count }
}
