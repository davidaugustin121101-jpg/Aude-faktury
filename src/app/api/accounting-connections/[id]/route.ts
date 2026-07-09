import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteVaultSecret } from '@/lib/vault-secrets'

interface Props {
  params: Promise<{ id: string }>
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: owned } = await supabase
    .from('accounting_connections')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!owned) {
    return NextResponse.json({ error: 'Připojení nenalezeno' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('accounting_connections')
    .select(
      'idoklad_client_secret_id, fakturoid_oauth_token_id, fakturoid_client_secret_id, superfaktura_api_key_id, bitfaktura_api_token_id, sucto_password_id'
    )
    .eq('id', id)
    .maybeSingle()

  if (row) {
    await deleteVaultSecret(admin, row.idoklad_client_secret_id)
    await deleteVaultSecret(admin, row.fakturoid_oauth_token_id)
    await deleteVaultSecret(admin, row.fakturoid_client_secret_id)
    await deleteVaultSecret(admin, row.superfaktura_api_key_id)
    await deleteVaultSecret(admin, row.bitfaktura_api_token_id)
    await deleteVaultSecret(admin, row.sucto_password_id)
  }

  const { error } = await admin
    .from('accounting_connections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
