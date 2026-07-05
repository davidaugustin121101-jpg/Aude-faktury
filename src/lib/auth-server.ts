import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { perfStart } from '@/lib/server-timing'

export const getServerSupabase = cache(async () => createClient())

export const getServerSession = cache(async () => {
  const end = perfStart('getServerSession')
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  end()
  return { supabase, user }
})

export const requireUser = cache(async (): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>
  user: User
}> => {
  const { supabase, user } = await getServerSession()
  if (!user) redirect('/login')
  return { supabase, user }
})

export type UserProfileRow = {
  full_name: string | null
  active_workspace_id: string | null
  plan: string | null
  invoice_credits: number | null
  is_accountant: boolean | null
  stripe_subscription_id: string | null
  stripe_addon_subscription_id: string | null
  country: string | null
}

export const getUserProfile = cache(async (userId: string): Promise<UserProfileRow | null> => {
  const end = perfStart('getUserProfile')
  const supabase = await getServerSupabase()
  const { data } = await supabase
    .from('user_profiles')
    .select(
      'full_name, active_workspace_id, plan, invoice_credits, is_accountant, stripe_subscription_id, stripe_addon_subscription_id, country'
    )
    .eq('id', userId)
    .maybeSingle()
  end()
  return data as UserProfileRow | null
})
