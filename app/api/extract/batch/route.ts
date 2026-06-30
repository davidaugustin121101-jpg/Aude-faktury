import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { PLANS } from '@/lib/stripe'
import { getActiveWorkspace } from '@/lib/workspace'
import { processInvoicePdf } from '@/lib/extract-invoice'

export const maxDuration = 300

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

    const formData = await req.formData()
    const files = formData.getAll('files').filter((f): f is File => f instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: 'Žádné soubory' }, { status: 400 })
    }
    if (files.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 souborů najednou' }, { status: 400 })
    }
    if (used + files.length > limit) {
      return NextResponse.json(
        {
          error: `Máš limit ${limit} faktur/měsíc. Zbývá ${Math.max(0, limit - used)}.`,
          upgrade_required: true,
        },
        { status: 429 }
      )
    }

    const workspace = await getActiveWorkspace(
      supabase,
      user.id,
      user.email ?? '',
      profile?.full_name
    )

    const results: Array<{
      filename: string
      ok: boolean
      invoiceId?: string
      error?: string
      fromMemory?: boolean
      duplicateWarning?: string | null
    }> = []

    for (const file of files) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        results.push({ filename: file.name, ok: false, error: 'Neplatný formát' })
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        results.push({ filename: file.name, ok: false, error: 'Soubor příliš velký' })
        continue
      }

      try {
        const buffer = await file.arrayBuffer()
        const result = await processInvoicePdf(supabase, user.id, workspace.id, {
          name: file.name,
          buffer,
        })
        results.push({
          filename: file.name,
          ok: true,
          invoiceId: result.invoice.id as string,
          fromMemory: result.fromMemory,
          duplicateWarning: result.duplicateWarning,
        })
      } catch (err) {
        results.push({
          filename: file.name,
          ok: false,
          error: err instanceof Error ? err.message : 'Chyba zpracování',
        })
      }
    }

    const succeeded = results.filter((r) => r.ok)
    return NextResponse.json({
      total: files.length,
      succeeded: succeeded.length,
      failed: results.length - succeeded.length,
      results,
    })
  } catch (err) {
    console.error('Batch extract error:', err)
    const message = err instanceof Error ? err.message : 'Hromadné zpracování selhalo.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
