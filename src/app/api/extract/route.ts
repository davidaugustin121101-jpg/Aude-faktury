import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveWorkspace } from '@/lib/workspace'
import { processInvoiceFromPdf, type ProcessInvoiceResult } from '@/lib/process-invoice-from-pdf'
import { reserveInvoiceAllowance, releaseInvoiceReservation, type AllowanceSource } from '@/lib/invoice-allowance'
import { checkRateLimit } from '@/lib/rate-limit'
import { PDF_MAX_BYTES } from '@/lib/pdf-limits'
import type { ExtractionStreamEvent } from '@/lib/extraction-progress'

export const runtime = 'nodejs'
export const maxDuration = 60

function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf') ||
    file.type === '' ||
    file.type === 'application/octet-stream'
  )
}

function wantsStream(req: NextRequest): boolean {
  return req.nextUrl.searchParams.get('stream') === '1'
}

function toJsonResponse(result: ProcessInvoiceResult) {
  if (!result.ok) {
    if (result.duplicate) {
      return NextResponse.json(
        {
          error: result.message,
          duplicate: true,
          existingInvoiceId: result.existingInvoiceId || undefined,
          existingStatus: result.existingStatus,
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    invoice: result.invoice,
    audit: result.audit,
    autoApproved: result.autoApproved,
  })
}

function toStreamResponse(
  result: ProcessInvoiceResult,
  emit: (event: ExtractionStreamEvent) => void
): Response {
  if (!result.ok) {
    emit({
      type: 'error',
      error: result.duplicate ? result.message : result.error,
      duplicate: result.duplicate,
      existingInvoiceId: result.duplicate ? result.existingInvoiceId : undefined,
      existingStatus: result.duplicate ? result.existingStatus : undefined,
      status: result.duplicate ? 409 : result.status,
    })
    return new Response(null, { status: result.duplicate ? 409 : result.status })
  }

  emit({
    type: 'done',
    invoice: { id: result.invoice.id },
    audit: result.audit,
    autoApproved: result.autoApproved,
  })
  return new Response(null, { status: 200 })
}

export async function POST(req: NextRequest) {
  let reservedSource: AllowanceSource | null = null
  let userId: string | null = null
  const stream = wantsStream(req)

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    userId = user.id

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Chybí soubor' }, { status: 400 })
    }
    if (!isPdfFile(file)) {
      return NextResponse.json({ error: 'Nahraj prosím PDF soubor' }, { status: 400 })
    }
    if (file.size > PDF_MAX_BYTES) {
      return NextResponse.json({ error: 'Soubor je příliš velký (max 5 MB)' }, { status: 400 })
    }

    const rate = checkRateLimit(`extract:${user.id}`, 12, 60_000)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Příliš mnoho nahrání. Zkuste znovu za ${rate.retryAfterSec ?? 60} s.` },
        { status: 429 }
      )
    }

    const admin = createAdminClient()
    const [{ data: profile }, { data: invoiceSettings }] = await Promise.all([
      admin
        .from('user_profiles')
        .select('plan, invoice_credits, is_accountant, stripe_subscription_id, full_name')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('invoice_settings')
        .select('auto_approve_below, notify_on_new, notify_email')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const allowance = await reserveInvoiceAllowance(user.id)
    if (!allowance.ok) {
      return NextResponse.json({ error: allowance.message }, { status: 429 })
    }

    reservedSource = allowance.source

    const workspace = await getActiveWorkspace(
      supabase,
      user.id,
      user.email ?? '',
      (profile as { full_name?: string } | null)?.full_name
    )

    const buffer = Buffer.from(await file.arrayBuffer())

    if (!stream) {
      const result = await processInvoiceFromPdf({
        supabase,
        admin,
        userId: user.id,
        userEmail: user.email ?? '',
        fullName: (profile as { full_name?: string } | null)?.full_name,
        workspaceId: workspace.id,
        pdfBuffer: buffer,
        filename: file.name,
        source: 'manual_upload',
        allowanceSource: allowance.source,
        invoiceSettings,
      })

      reservedSource = null
      return toJsonResponse(result)
    }

    const encoder = new TextEncoder()

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: ExtractionStreamEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
        }

        emit({ type: 'progress', percent: 1, label: 'Zahajuji zpracování…', phase: 'start' })

        try {
          const result = await processInvoiceFromPdf({
            supabase,
            admin,
            userId: user.id,
            userEmail: user.email ?? '',
            fullName: (profile as { full_name?: string } | null)?.full_name,
            workspaceId: workspace.id,
            pdfBuffer: buffer,
            filename: file.name,
            source: 'manual_upload',
            allowanceSource: allowance.source,
            invoiceSettings,
            onProgress: (update) => emit({ type: 'progress', ...update }),
          })

          reservedSource = null
          toStreamResponse(result, emit)
        } catch (err) {
          if (userId && reservedSource) {
            await releaseInvoiceReservation(userId, reservedSource).catch(() => {})
            reservedSource = null
          }
          const message = err instanceof Error ? err.message : 'Neočekávaná chyba při zpracování'
          emit({ type: 'error', error: message, status: 500 })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    if (userId && reservedSource) {
      await releaseInvoiceReservation(userId, reservedSource).catch(() => {})
    }
    console.error('[extract] unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba při zpracování'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
