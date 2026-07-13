#!/usr/bin/env node
/**
 * Nastaví Supabase Auth URL pro migraci na audeflow.cz
 *
 * Použití:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/update-supabase-auth-urls.mjs
 *
 * Token: https://supabase.com/dashboard/account/tokens (scope: auth:write)
 */

const PROJECT_REF = 'rddjtylcmxsnxhwjlvaj'
const SITE_URL = 'https://audeflow.cz'

const REDIRECT_URLS = [
  'https://audeflow.cz/**',
  'https://www.audeflow.cz/**',
  'https://faktury.audeflow.cz/**',
  'http://localhost:3000/**',
  'https://*.vercel.app/**',
]

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
if (!token) {
  console.error('Chybí SUPABASE_ACCESS_TOKEN')
  console.error('Vytvoř token: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const base = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const getRes = await fetch(base, { headers })
if (!getRes.ok) {
  console.error('GET auth config failed:', getRes.status, await getRes.text())
  process.exit(1)
}

const before = await getRes.json()
console.log('Předchozí site_url:', before.site_url)
console.log('Předchozí redirect URLs:', before.uri_allow_list || '(prázdné)')

const patchRes = await fetch(base, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    site_url: SITE_URL,
    uri_allow_list: REDIRECT_URLS.join('\n'),
  }),
})

if (!patchRes.ok) {
  console.error('PATCH auth config failed:', patchRes.status, await patchRes.text())
  process.exit(1)
}

const after = await patchRes.json()
console.log('\n✓ Hotovo')
console.log('site_url:', after.site_url)
console.log('uri_allow_list:\n', after.uri_allow_list)
