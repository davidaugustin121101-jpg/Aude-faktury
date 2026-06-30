import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase-server'
import {
  buildFakturoidAuthorizeUrl,
  probeFakturoidOAuthAuthorizeUrl,
  validateFakturoidOAuthSetup,
} from '@/lib/fakturoid-oauth'
import { getActiveWorkspace } from '@/lib/workspace'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const settingsUrl = new URL('/dashboard/settings/accounting', appUrl)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(
      new URL('/login?next=/dashboard/settings/accounting', appUrl)
    )
  }

  if (!process.env.FAKTUROID_CLIENT_ID || !process.env.FAKTUROID_CLIENT_SECRET) {
    settingsUrl.searchParams.set('error', 'fakturoid_not_configured')
    return NextResponse.redirect(settingsUrl)
  }

  const setup = validateFakturoidOAuthSetup()
  if (!setup.ok) {
    settingsUrl.searchParams.set('error', encodeURIComponent(setup.error ?? 'fakturoid_redirect'))
    return NextResponse.redirect(settingsUrl)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const workspace = await getActiveWorkspace(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name
  )

  const state = randomBytes(24).toString('hex')
  const authorizeUrl = buildFakturoidAuthorizeUrl(state)

  const probe = await probeFakturoidOAuthAuthorizeUrl(authorizeUrl)
  if (!probe.ok) {
    settingsUrl.searchParams.set(
      'error',
      encodeURIComponent(
        `Fakturoid odmítl OAuth (HTTP ${probe.status}). V integraci Fakturoidu nastav přesně tuto Redirect URL: ${setup.redirectUri}`
      )
    )
    return NextResponse.redirect(settingsUrl)
  }

  const cookieStore = await cookies()
  cookieStore.set('fakturoid_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  cookieStore.set('fakturoid_oauth_workspace', workspace.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return NextResponse.redirect(authorizeUrl)
}
