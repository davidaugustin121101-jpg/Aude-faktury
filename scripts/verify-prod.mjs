#!/usr/bin/env node
/**
 * Ověření produkčního deploye — spusťte: node scripts/verify-prod.mjs
 * Volitelně: APP_URL=https://faktury.audeflow.cz node scripts/verify-prod.mjs
 */
const APP_URL = process.env.APP_URL ?? 'https://faktury.audeflow.cz'

async function check(name, url, expectOk = true) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const body = await res.text()
    let json = null
    try {
      json = JSON.parse(body)
    } catch {
      /* landing HTML */
    }
    const pass = expectOk ? res.ok : true
    console.log(`${pass ? '✓' : '✗'} ${name}: HTTP ${res.status}`)
    if (json) console.log('  ', JSON.stringify(json, null, 2).split('\n').join('\n   '))
    return pass
  } catch (err) {
    console.log(`✗ ${name}: ${err.message}`)
    return false
  }
}

console.log(`Verifying ${APP_URL}\n`)

const results = await Promise.all([
  check('Landing page', APP_URL),
  check('Health API', `${APP_URL}/api/health`),
])

const allOk = results.every(Boolean)
console.log(allOk ? '\nProdukce vypadá OK.' : '\nNěkteré kontroly selhaly — zkontrolujte Vercel env a deploy.')
process.exit(allOk ? 0 : 1)
