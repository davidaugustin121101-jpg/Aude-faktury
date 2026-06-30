import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { PLANS } from '@/lib/stripe'
import { getActiveWorkspace } from '@/lib/workspace'
import { processInvoicePdf } from '@/lib/extract-invoice'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nejsi přihlášen' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, invoices_this_month, full_name')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan ?? 'free') as keyof typeof PLANS
    const limit = PLANS[plan]?.limit ?? 10
    const used = profile?.invoices_this_month ?? 0

    if (used >= limit) {
      return NextResponse.json(
        {
          error: `Dosáhl jsi limitu ${limit} faktur pro tento měsíc. Upgraduj svůj plán v nastavení.`,
          upgrade_required: true,
        },
        { status: 429 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Soubor nenalezen' }, { status: 400 })
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Povolen pouze formát PDF' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Soubor je příliš velký (max 10 MB)' }, { status: 400 })
    }

    const workspace = await getActiveWorkspace(
      supabase,
      user.id,
      user.email ?? '',
      profile?.full_name
    )

    const buffer = await file.arrayBuffer()
    const result = await processInvoicePdf(supabase, user.id, workspace.id, {
      name: file.name,
      buffer,
    })

    return NextResponse.json({
      invoice: result.invoice,
      fromMemory: result.fromMemory,
      duplicateWarning: result.duplicateWarning,
    })
  } catch (err) {
    console.error('Extract error:', err)
    const message =
      err instanceof Error ? err.message : 'Při zpracování faktury nastala neočekávaná chyba.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
