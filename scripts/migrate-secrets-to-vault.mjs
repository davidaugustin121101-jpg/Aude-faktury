#!/usr/bin/env node
/**
 * Jednorázová migrace plaintext credentials → Supabase Vault.
 * Vyžaduje: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 * Spusťte až po aplikaci migrace 013_vault_credentials.sql
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Chybí NEXT_PUBLIC_SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key)

async function storeSecret(secret, name, description) {
  const { data, error } = await admin.rpc('store_vault_secret', {
    p_secret: secret,
    p_name: name,
    p_description: description,
  })
  if (error) throw new Error(error.message)
  return data
}

const { data: rows, error } = await admin.from('accounting_connections').select('*')
if (error) {
  console.error(error.message)
  process.exit(1)
}

let migrated = 0
for (const row of rows ?? []) {
  const prefix = `acct_${row.user_id}_${row.workspace_id}_${row.provider}`
  const patch = {}

  if (row.idoklad_client_secret && !row.idoklad_client_secret_id) {
    patch.idoklad_client_secret_id = await storeSecret(
      row.idoklad_client_secret,
      `${prefix}_idoklad_secret`,
      'iDoklad client secret'
    )
    patch.idoklad_client_secret = null
  }
  if (row.fakturoid_oauth_token && !row.fakturoid_oauth_token_id) {
    patch.fakturoid_oauth_token_id = await storeSecret(
      row.fakturoid_oauth_token,
      `${prefix}_fakturoid_token`,
      'Fakturoid token'
    )
    patch.fakturoid_oauth_token = null
  }
  if (row.fakturoid_client_secret && !row.fakturoid_client_secret_id) {
    patch.fakturoid_client_secret_id = await storeSecret(
      row.fakturoid_client_secret,
      `${prefix}_fakturoid_secret`,
      'Fakturoid secret'
    )
    patch.fakturoid_client_secret = null
  }
  if (row.superfaktura_api_key && !row.superfaktura_api_key_id) {
    patch.superfaktura_api_key_id = await storeSecret(
      row.superfaktura_api_key,
      `${prefix}_superfaktura_key`,
      'SuperFaktura API key'
    )
    patch.superfaktura_api_key = null
  }

  if (Object.keys(patch).length > 0) {
    await admin.from('accounting_connections').update(patch).eq('id', row.id)
    migrated++
    console.log(`✓ ${row.id} (${row.provider})`)
  }
}

console.log(`\nHotovo — migrováno ${migrated} připojení.`)
