import { NextResponse } from 'next/server'

/** Veřejná kontrola — bez detailů o konfiguraci */
export async function GET() {
  const ok = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.ANTHROPIC_API_KEY

  return NextResponse.json(
    { ok, service: 'faktury-audeflow' },
    { status: ok ? 200 : 503 }
  )
}
