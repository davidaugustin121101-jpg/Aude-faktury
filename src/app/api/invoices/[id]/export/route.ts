import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ProcessedInvoice } from '@/types/invoices'
import {
  generateExport,
  isExportFormat,
  type ExportFormat,
} from '@/lib/export'
import {
  loadExportProfileForInvoice,
  mergeExportProfile,
} from '@/lib/export/export-profile'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const formatParam = req.nextUrl.searchParams.get('format') ?? 'isdoc'
  const forceExport = req.nextUrl.searchParams.get('force') === '1'

  if (!isExportFormat(formatParam)) {
    return NextResponse.json(
      {
        error:
          'Neplatný formát. Podporováno: isdoc, pohoda, money_isdoc, money_native, helios_red, helios_inuvio',
      },
      { status: 400 }
    )
  }

  const format = formatParam as ExportFormat

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { data: invoice } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 })

  const inv = invoice as ProcessedInvoice

  const workspaceProfile = await loadExportProfileForInvoice(supabase, inv.workspace_id)
  const exportProfile = mergeExportProfile(workspaceProfile)

  const { result, validation } = await generateExport(format, {
    invoice: inv,
    profile: exportProfile,
    forceExport,
  })

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: 'Export nelze vygenerovat',
        validation,
      },
      { status: 422 }
    )
  }

  if (result.kind === 'binary') {
    return new NextResponse(new Uint8Array(result.content), {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    })
  }

  return new NextResponse(result.content, {
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    },
  })
}
