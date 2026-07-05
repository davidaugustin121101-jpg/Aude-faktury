import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { safeRedirectPath } from '@/lib/safe-redirect'
import type { CountryCode } from '@/lib/accounting-codes'

async function syncUserCountry(userId: string, country: CountryCode | undefined) {
  if (country !== 'cz' && country !== 'sk') return

  const admin = createAdminClient()
  await admin
    .from('user_profiles')
    .update({ country, country_confirmed_at: new Date().toISOString() })
    .eq('id', userId)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const metaCountry = user.user_metadata?.country as CountryCode | undefined
        await syncUserCountry(user.id, metaCountry)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
