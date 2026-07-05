/** Escapuje text pro XML elementy */
export function escapeXml(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatDateIso(d: string | null | undefined): string {
  if (!d) return new Date().toISOString().slice(0, 10)
  return d.slice(0, 10)
}

/** dd-MM-yyyy pro Helios Red */
export function formatDateHelios(d: string | null | undefined): string {
  const iso = formatDateIso(d)
  const [y, m, day] = iso.split('-')
  return `${day}-${m}-${y}`
}

export function formatMoney(amount: number): string {
  return amount.toFixed(2)
}

export function safeFilenamePart(value: string): string {
  return value.replace(/[^\w.-]/g, '_').slice(0, 80)
}
