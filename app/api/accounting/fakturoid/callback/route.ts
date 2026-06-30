import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase-server'
import {
  exchangeFakturoidCode,
  fetchFakturoidUser,
  pickFakturoidAccount,
  tokenExpiresAt,
} from '@/lib/fakturoid-oauth'
import { getActiveWorkspace } from '@/lib/workspace'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const settingsUrl = new URL('/dashboard/settings/accounting', appUrl)

  const error = req.nextUrl.searchParams.get('error')
  if (error) {
    settingsUrl.searchParams.set('error', `fakturoid_denied`)
    return NextResponse.redirect(settingsUrl)
  }

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const cookieStore = await cookies()
  const savedState = cookieStore.get('fakturoid_oauth_state')?.value
  const workspaceId = cookieStore.get('fakturoid_oauth_workspace')?.value
  cookieStore.delete('fakturoid_oauth_state')
  cookieStore.delete('fakturoid_oauth_workspace')

  if (!code || !state || !savedState || state !== savedState) {
    settingsUrl.searchParams.set('error', 'fakturoid_state')
    return NextResponse.redirect(settingsUrl)
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', appUrl))
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  let targetWorkspaceId = workspaceId
  if (!targetWorkspaceId) {
    const ws = await getActiveWorkspace(supabase, user.id, user.email ?? '', profile?.full_name)
    targetWorkspaceId = ws.id
  }

  try {
    const tokens = await exchangeFakturoidCode(code)
    const fakturoidUser = await fetchFakturoidUser(tokens.access_token)
    const account = pickFakturoidAccount(fakturoidUser)

    await supabase
      .from('accounting_connections')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('workspace_id', targetWorkspaceId)

    const { error: dbError } = await supabase.from('accounting_connections').insert({
      user_id: user.id,
      workspace_id: targetWorkspaceId,
      provider: 'fakturoid',
      connection_mode: 'oauth',
      fakturoid_oauth_token: tokens.access_token,
      fakturoid_refresh_token: tokens.refresh_token,
      fakturoid_token_expires_at: tokenExpiresAt(tokens.expires_in),
      fakturoid_account_slug: account.slug,
      connection_label: account.name,
      is_active: true,
      last_tested_at: new Date().toISOString(),
      last_test_ok: true,
    })

    if (dbError) throw dbError

    settingsUrl.searchParams.set('connected', 'fakturoid')
    return NextResponse.redirect(settingsUrl)
  } catch (err) {
    console.error('Fakturoid OAuth callback:', err)
    settingsUrl.searchParams.set(
      'error',
      err instanceof Error ? err.message : 'fakturoid_failed'
    )
    return NextResponse.redirect(settingsUrl)
  }
}
