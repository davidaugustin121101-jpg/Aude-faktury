import { NextResponse } from 'next/server'
import { validateFakturoidOAuthSetup } from '@/lib/fakturoid-oauth'

export async function GET() {
  const setup = validateFakturoidOAuthSetup()
  const oauthConfigured = Boolean(
    process.env.FAKTUROID_CLIENT_ID && process.env.FAKTUROID_CLIENT_SECRET
  )

  return NextResponse.json({
    oauthConfigured,
    oauthReady: setup.ok && oauthConfigured,
    redirectUri: setup.redirectUri,
    redirectError: setup.error ?? null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  })
}
