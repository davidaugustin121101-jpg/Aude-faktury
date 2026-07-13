#!/usr/bin/env node
/**
 * Vygeneruje ukázkové exporty do tmp/exports/ pro ruční kontrolu nebo odeslání účetnímu.
 * Použití: npm run export:samples
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { generateExport } from '../src/lib/export/index.ts'
import { normalizeInvoice } from '../src/lib/export/normalize.ts'
import { sampleInvoice } from '../tests/fixtures/invoices/sample.ts'

const outDir = join(process.cwd(), 'tmp', 'exports')
mkdirSync(outDir, { recursive: true })

const profile = {
  companyIco: '87654321',
  defaultAccountCode: '518',
  costCenter: '100',
  contractCode: 'ZAK-01',
  moneyDocumentType: 'FP',
}

const invoice = {
  ...sampleInvoice,
  raw_extraction: {
    je_prenesena_dan: false,
    datum_duzp: '2024-06-20',
    polozky: [
      { nazev: 'IT služby', mnozstvi: 1, jednotkova_cena: 1000, sazba_dph: 21, typ: 'sluzba' },
    ],
    cislo_uctu: '1234567891/0321',
  },
}

const formats = [
  'isdoc',
  'pohoda',
  'money_isdoc',
  'money_native',
  'helios_red',
  'helios_inuvio',
]

for (const format of formats) {
  const { result, validation } = await generateExport(format, { invoice, profile })
  if (!validation.ok) {
    console.error(`❌ ${format}:`, validation.errors.map((e) => e.message).join('; '))
    continue
  }
  const path = join(outDir, result.filename)
  if (result.kind === 'binary') {
    writeFileSync(path, result.content)
  } else {
    writeFileSync(path, result.content, 'utf8')
  }
  console.log(`✓ ${format} → ${path}`)
}

console.log(`\nSoubory připraveny v ${outDir}`)
console.log('Import: Pohoda → Datová komunikace → XML | Money → ISDOC | Helios → PRIFAK.csv + PRIPOL.csv')
