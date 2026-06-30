import { createClient } from '@supabase/supabase-js'

/** Service role klient – jen na serveru (storage, admin operace). */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Chybí SUPABASE_SERVICE_ROLE_KEY pro admin operace.')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
