import type { SupabaseClient } from '@supabase/supabase-js'

/** Uloží tajemství do Supabase Vault, vrátí secret ID */
export async function storeVaultSecret(
  admin: SupabaseClient,
  secret: string | null | undefined,
  name: string,
  description?: string
): Promise<string | null> {
  if (!secret) return null

  const { data, error } = await admin.rpc('store_vault_secret', {
    p_secret: secret,
    p_name: name,
    p_description: description ?? null,
  })

  if (error) {
    console.error('[vault] store failed:', error.message)
    return null
  }

  return (data as string | null) ?? null
}

/** Načte tajemství z Vault podle secret ID */
export async function readVaultSecret(
  admin: SupabaseClient,
  secretId: string | null | undefined
): Promise<string | null> {
  if (!secretId) return null

  const { data, error } = await admin.rpc('read_vault_secret', {
    p_secret_id: secretId,
  })

  if (error) {
    console.error('[vault] read failed:', error.message)
    return null
  }

  return (data as string | null) ?? null
}

export async function deleteVaultSecret(
  admin: SupabaseClient,
  secretId: string | null | undefined
): Promise<void> {
  if (!secretId) return
  await admin.rpc('delete_vault_secret', { p_secret_id: secretId })
}

/** Vyplní plaintext hodnoty z Vault sloupců (fallback na legacy plaintext) */
export async function hydrateConnectionSecrets(
  admin: SupabaseClient,
  row: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const out = { ...row }

  const idokladSecretId = row.idoklad_client_secret_id as string | null
  if (idokladSecretId && !row.idoklad_client_secret) {
    out.idoklad_client_secret = await readVaultSecret(admin, idokladSecretId)
  }

  const fakturoidTokenId = row.fakturoid_oauth_token_id as string | null
  if (fakturoidTokenId && !row.fakturoid_oauth_token) {
    out.fakturoid_oauth_token = await readVaultSecret(admin, fakturoidTokenId)
  }

  const fakturoidSecretId = row.fakturoid_client_secret_id as string | null
  if (fakturoidSecretId && !row.fakturoid_client_secret) {
    out.fakturoid_client_secret = await readVaultSecret(admin, fakturoidSecretId)
  }

  const superfakturaKeyId = row.superfaktura_api_key_id as string | null
  if (superfakturaKeyId && !row.superfaktura_api_key) {
    out.superfaktura_api_key = await readVaultSecret(admin, superfakturaKeyId)
  }

  const bitfakturaTokenId = row.bitfaktura_api_token_id as string | null
  if (bitfakturaTokenId && !row.bitfaktura_api_token) {
    out.bitfaktura_api_token = await readVaultSecret(admin, bitfakturaTokenId)
  }

  const suctoPasswordId = row.sucto_password_id as string | null
  if (suctoPasswordId && !row.sucto_password) {
    out.sucto_password = await readVaultSecret(admin, suctoPasswordId)
  }

  return out
}
