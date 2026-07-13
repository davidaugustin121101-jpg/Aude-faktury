#!/usr/bin/env node
/**
 * Generuje favicony, PWA ikony a OG obrázek z public/brand/audeflow-logo.png
 *
 *   node scripts/generate-icons.mjs
 */

import sharp from 'sharp'
import { mkdirSync } from 'fs'

const LOGO = 'public/brand/audeflow-logo.png'
const ICON_SIZES = [16, 32, 48, 180, 192, 512]

mkdirSync('public/icons', { recursive: true })

async function squareIcon(size) {
  const pad = Math.round(size * 0.12)
  const inner = size - pad * 2
  const resized = await sharp(LOGO)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer()
  const meta = await sharp(resized).metadata()
  const left = Math.round((size - (meta.width ?? inner)) / 2)
  const top = Math.round((size - (meta.height ?? inner)) / 2)
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer()
}

for (const size of ICON_SIZES) {
  const buf = await squareIcon(size)
  await sharp(buf).toFile(`public/icons/icon-${size}.png`)
  console.log(`✓ icon-${size}.png`)
}

await sharp('public/icons/icon-32.png').toFile('public/favicon.ico')
await sharp('public/icons/icon-32.png').toFile('src/app/favicon.ico')
await sharp('public/icons/icon-32.png').toFile('src/app/icon.png')
await sharp('public/icons/icon-180.png').toFile('src/app/apple-icon.png')

const copies = [
  ['public/icons/icon-16.png', 'public/favicon-16x16.png'],
  ['public/icons/icon-32.png', 'public/favicon-32x32.png'],
  ['public/icons/icon-180.png', 'public/apple-touch-icon.png'],
  ['public/icons/icon-192.png', 'public/icon-192.png'],
  ['public/icons/icon-512.png', 'public/icon-512.png'],
]

for (const [from, to] of copies) {
  await sharp(from).toFile(to)
}

const ogW = 1200
const ogH = 630
const logoW = 520
const logoBuf = await sharp(LOGO).resize({ width: logoW, fit: 'inside' }).png().toBuffer()
const logoMeta = await sharp(logoBuf).metadata()
const ogLeft = Math.round((ogW - (logoMeta.width ?? logoW)) / 2)
const ogTop = Math.round((ogH - (logoMeta.height ?? 200)) / 2)

await sharp({
  create: { width: ogW, height: ogH, channels: 4, background: { r: 248, g: 250, b: 252, alpha: 1 } },
})
  .composite([{ input: logoBuf, left: ogLeft, top: ogTop }])
  .png()
  .toFile('public/og-image.png')

await sharp('public/og-image.png').toFile('src/app/opengraph-image.png')

console.log('✓ favicon.ico, og-image.png, app metadata icons')
