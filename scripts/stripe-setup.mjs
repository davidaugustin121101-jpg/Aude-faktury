#!/usr/bin/env node
/**
 * Vytvoří Stripe produkty + ceny pro tarify a modul více klientů.
 *
 * Použití:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs
 */

import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('Chybí STRIPE_SECRET_KEY')
  process.exit(1)
}

const stripe = new Stripe(key, { typescript: true })

const tiers = [
  {
    env: 'STRIPE_PRICE_STARTER',
    name: 'Faktury Audeflow — Standard',
    description: '100 faktur jako kredit (jednorázová platba, bez expirace).',
    amount: 29900,
    plan: 'starter',
    oneTime: true,
  },
  {
    env: 'STRIPE_PRICE_PRO',
    name: 'Faktury Audeflow — Pro',
    description: 'Neomezeně faktur měsíčně, jeden fakturační systém.',
    amount: 89900,
    plan: 'pro',
    oneTime: false,
  },
  {
    env: 'STRIPE_PRICE_MULTI_CLIENT',
    name: 'Faktury Audeflow — Modul více klientů',
    description:
      'Doplňek — vyžaduje kredity Standard nebo tarif Pro. Více klientů, každý vlastní fakturační systém.',
    amount: 29900,
    plan: 'multi_client',
    oneTime: false,
  },
]

console.log('\n✅ Vytvářím Stripe produkty…\n')

for (const tier of tiers) {
  const product = await stripe.products.create({
    name: tier.name,
    description: tier.description,
    metadata: { plan: tier.plan },
  })

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'czk',
    unit_amount: tier.amount,
    ...(tier.oneTime ? {} : { recurring: { interval: 'month' } }),
    metadata: { plan: tier.plan },
  })

  console.log(`${tier.name}`)
  console.log(`  Typ: ${tier.oneTime ? 'jednorázová platba' : 'měsíční předplatné'}`)
  console.log(`  Product ID: ${product.id}`)
  console.log(`  ${tier.env}=${price.id}`)
  console.log('')
}

console.log('Poznámka: STRIPE_PRICE_ACCOUNTANT je zastaralé — použijte STRIPE_PRICE_MULTI_CLIENT')
console.log('\nWebhook: https://audeflow.cz/api/stripe/webhook')
