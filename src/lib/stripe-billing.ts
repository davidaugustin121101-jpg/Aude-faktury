import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import {
  getStripePriceId,
  isMultiClientPlan,
  isValidStripePlan,
  STRIPE_MULTI_CLIENT_PLAN,
  type StripePlanId,
} from '@/lib/stripe-config'
import type { SupabaseClient } from '@supabase/supabase-js'
import { STANDARD_PACK_CREDITS } from '@/lib/account-mode'

export async function findUserIdByStripeCustomer(
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}

async function findUserIdByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  return data?.id ?? null
}

async function resolveUserIdByStripeCustomerEmail(
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const stripe = getStripe()
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted || !customer.email) return null
  return findUserIdByEmail(supabase, customer.email)
}

export async function resolveUserIdFromSubscription(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
): Promise<string | null> {
  if (subscription.metadata?.supabase_user_id) {
    return subscription.metadata.supabase_user_id
  }
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id
  if (!customerId) return null

  const byCustomer = await findUserIdByStripeCustomer(supabase, customerId)
  if (byCustomer) return byCustomer

  return resolveUserIdByStripeCustomerEmail(supabase, customerId)
}

export async function resolveUserIdFromSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<string | null> {
  if (session.metadata?.supabase_user_id) {
    return session.metadata.supabase_user_id
  }

  const sessionEmail = session.customer_details?.email ?? session.customer_email
  if (sessionEmail) {
    const byEmail = await findUserIdByEmail(supabase, sessionEmail)
    if (byEmail) return byEmail
  }

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (!customerId) return null

  const byCustomer = await findUserIdByStripeCustomer(supabase, customerId)
  if (byCustomer) return byCustomer

  return resolveUserIdByStripeCustomerEmail(supabase, customerId)
}

function isActiveSubscriptionStatus(subscription: Stripe.Subscription): boolean {
  return subscription.status === 'active' || subscription.status === 'trialing'
}

/** Určí typ předplatného z metadat nebo price ID */
export function resolvePlanFromSubscription(
  subscription: Stripe.Subscription
): StripePlanId | null {
  const meta = subscription.metadata?.plan ?? ''
  if (isValidStripePlan(meta)) return meta

  for (const item of subscription.items.data) {
    const priceId = item.price.id
    if (priceId === getStripePriceId('pro')) return 'pro'
    if (priceId === getStripePriceId(STRIPE_MULTI_CLIENT_PLAN)) return STRIPE_MULTI_CLIENT_PLAN
  }

  return null
}

function classifySubscriptions(subscriptions: Stripe.Subscription[]) {
  const active = subscriptions.filter(isActiveSubscriptionStatus)
  let base: { subscription: Stripe.Subscription; plan: 'pro' } | undefined
  let addon: Stripe.Subscription | undefined

  for (const sub of active) {
    const plan = resolvePlanFromSubscription(sub)
    if (plan === 'pro') {
      base = { subscription: sub, plan: 'pro' }
    } else if (plan && isMultiClientPlan(plan)) {
      addon = sub
    }
  }

  return { base, addon }
}

export async function addInvoiceCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  stripeCustomerId?: string | null
) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('invoice_credits')
    .eq('id', userId)
    .maybeSingle()

  const patch: Record<string, number | string> = {
    invoice_credits: (profile?.invoice_credits ?? 0) + amount,
  }
  if (stripeCustomerId) patch.stripe_customer_id = stripeCustomerId

  const { error } = await supabase.from('user_profiles').update(patch).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function activateBaseBilling(
  supabase: SupabaseClient,
  userId: string,
  data: {
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
  }
) {
  const patch: Record<string, string> = { plan: 'pro' }
  if (data.stripeCustomerId) patch.stripe_customer_id = data.stripeCustomerId
  if (data.stripeSubscriptionId) patch.stripe_subscription_id = data.stripeSubscriptionId

  const { error } = await supabase.from('user_profiles').update(patch).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function activateAddonBilling(
  supabase: SupabaseClient,
  userId: string,
  data: {
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
  }
) {
  const patch: Record<string, string | boolean> = { is_accountant: true }
  if (data.stripeCustomerId) patch.stripe_customer_id = data.stripeCustomerId
  if (data.stripeSubscriptionId) patch.stripe_addon_subscription_id = data.stripeSubscriptionId

  const { error } = await supabase.from('user_profiles').update(patch).eq('id', userId)
  if (error) throw new Error(error.message)
}

/** @deprecated */
export async function activateBilling(
  supabase: SupabaseClient,
  userId: string,
  data: {
    plan: StripePlanId
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
  }
) {
  if (isMultiClientPlan(data.plan)) {
    return activateAddonBilling(supabase, userId, data)
  }
  if (data.plan === 'pro') {
    return activateBaseBilling(supabase, userId, data)
  }
}

export async function deactivateBaseBilling(supabase: SupabaseClient, userId: string) {
  await supabase
    .from('user_profiles')
    .update({ plan: 'free', stripe_subscription_id: null })
    .eq('id', userId)
}

export async function deactivateAddonBilling(supabase: SupabaseClient, userId: string) {
  await supabase
    .from('user_profiles')
    .update({ is_accountant: false, stripe_addon_subscription_id: null })
    .eq('id', userId)
}

/** @deprecated */
export async function deactivateBilling(supabase: SupabaseClient, userId: string) {
  await deactivateBaseBilling(supabase, userId)
  await deactivateAddonBilling(supabase, userId)
}

export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<string> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  const existing = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id
  if (existing) return existing

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  await supabase
    .from('user_profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

export async function syncSubscriptionState(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const userId = await resolveUserIdFromSubscription(supabase, subscription)
  if (!userId) return

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, stripe_addon_subscription_id')
    .eq('id', userId)
    .maybeSingle()

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id

  const plan = resolvePlanFromSubscription(subscription)

  if (isActiveSubscriptionStatus(subscription)) {
    if (plan === 'pro') {
      await activateBaseBilling(supabase, userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
      })
      return
    }
    if (plan && isMultiClientPlan(plan)) {
      await activateAddonBilling(supabase, userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
      })
      return
    }
    return
  }

  // Zrušené / neaktivní předplatné
  if (subscription.id === profile?.stripe_subscription_id) {
    await deactivateBaseBilling(supabase, userId)
  }
  if (subscription.id === profile?.stripe_addon_subscription_id) {
    await deactivateAddonBilling(supabase, userId)
  }
}

export async function syncUserSubscriptionFromStripe(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string | null
): Promise<{
  activated: boolean
  plan?: 'pro'
  creditsAdded?: boolean
  hasAddon?: boolean
  status?: string
  pending?: boolean
  error?: string
}> {
  const stripe = getStripe()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  let customerId = profile?.stripe_customer_id ?? null

  if (!customerId && userEmail) {
    const customers = await stripe.customers.list({ email: userEmail, limit: 3 })
    const match = customers.data.find((c) => !c.deleted) ?? customers.data[0]
    if (match) {
      customerId = match.id
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }
  }

  if (!customerId) {
    return {
      activated: false,
      error:
        'Ve Stripe není propojený zákazník — přihlaste se stejným e-mailem jako ve Stripe.',
    }
  }

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 20,
    expand: ['data.items'],
  })

  const { base, addon } = classifySubscriptions(subs.data)
  const active = subs.data.filter(isActiveSubscriptionStatus)

  // Legacy: staré jediné předplatné „účetní firma“ = Pro + modul
  if (!base && !addon && active.length === 1) {
    const legacyPlan = resolvePlanFromSubscription(active[0])
    if (legacyPlan && isMultiClientPlan(legacyPlan)) {
      await activateBaseBilling(supabase, userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: active[0].id,
      })
      await activateAddonBilling(supabase, userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: active[0].id,
      })
      return {
        activated: true,
        plan: 'pro',
        hasAddon: true,
        status: active[0].status,
      }
    }
  }

  if (base) {
    await activateBaseBilling(supabase, userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: base.subscription.id,
    })
  } else {
    await deactivateBaseBilling(supabase, userId)
  }

  if (addon) {
    await activateAddonBilling(supabase, userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: addon.id,
    })
  } else {
    await deactivateAddonBilling(supabase, userId)
  }

  if (base || addon) {
    return {
      activated: true,
      plan: base?.plan ?? 'pro',
      hasAddon: !!addon,
      status: base?.subscription.status ?? addon?.status,
    }
  }

  const pending = subs.data.find(
    (sub) =>
      resolvePlanFromSubscription(sub) &&
      (sub.status === 'incomplete' || sub.status === 'past_due')
  )
  if (pending) {
    return { activated: false, pending: true, status: pending.status }
  }

  return {
    activated: false,
    error: 'Aktivní předplatné u tohoto Stripe zákazníka nenalezeno.',
  }
}

export async function activateFromCheckoutSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  const userId = await resolveUserIdFromSession(supabase, session)
  if (!userId) return

  const metaPlan = session.metadata?.plan ?? ''
  if (!isValidStripePlan(metaPlan)) return

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id

  if (session.payment_status === 'unpaid') return

  const sessionKey = `checkout_session_${session.id}`
  const { data: claimed, error: claimErr } = await supabase.rpc('claim_stripe_webhook_event', {
    p_event_id: sessionKey,
    p_event_type: 'checkout.session.processed',
  })

  if (!claimErr && claimed === false) {
    return
  }

  // Standard = jednorázová platba → kredit faktur
  if (session.mode === 'payment') {
    if (metaPlan === 'starter') {
      await addInvoiceCredits(supabase, userId, STANDARD_PACK_CREDITS, customerId)
    }
    return
  }

  if (session.mode !== 'subscription') return

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

  if (metaPlan === 'pro') {
    await activateBaseBilling(supabase, userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    })
  } else if (isMultiClientPlan(metaPlan)) {
    await activateAddonBilling(supabase, userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    })
  }
}

export { getStripe }
