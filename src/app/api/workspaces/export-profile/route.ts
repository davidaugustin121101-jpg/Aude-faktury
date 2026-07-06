import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ error: 'Chybí workspaceId' }, { status: 400 })
  }

  const { data } = await supabase
    .from('workspaces')
    .select(
      'id, name, export_company_ico, export_default_account_code, export_cost_center, export_contract_code, export_money_document_type, export_helios_variant, export_country'
    )
    .eq('id', workspaceId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!data) return NextResponse.json({ error: 'Workspace nenalezen' }, { status: 404 })

  return NextResponse.json({ profile: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const body = await req.json()
  const { workspaceId, ...fields } = body as { workspaceId: string } & Record<string, string>

  if (!workspaceId) {
    return NextResponse.json({ error: 'Chybí workspaceId' }, { status: 400 })
  }

  const patch = {
    export_company_ico: fields.export_company_ico || null,
    export_default_account_code: fields.export_default_account_code || null,
    export_cost_center: fields.export_cost_center || null,
    export_contract_code: fields.export_contract_code || null,
    export_money_document_type: fields.export_money_document_type || 'FP',
    export_helios_variant: fields.export_helios_variant === 'inuvio' ? 'inuvio' : 'red',
    export_country: 'cz',
  }

  const { error } = await supabase
    .from('workspaces')
    .update(patch)
    .eq('id', workspaceId)
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
