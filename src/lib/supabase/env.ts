/** Odstraní /rest/v1 nebo koncové lomítko — častá chyba při kopírování z Supabase dashboardu. */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!raw) return ''

  return raw
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '')
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''
}
