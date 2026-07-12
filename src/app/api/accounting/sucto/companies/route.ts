import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listSuctoCompanies } from '@/lib/sucto'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`sucto-companies:${user.id}`, 15, 60_000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Příliš mnoho pokusů. Zkuste znovu za ${rate.retryAfterSec ?? 60} s.` },
      { status: 429 }
    )
  }

  const body = (await req.json()) as { email?: string; password?: string }
  const email = body.email?.trim()
  const password = body.password ?? ''

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Vyplňte e-mail a heslo ze Súčta, pak klikněte na Načíst firmy.' },
      { status: 400 }
    )
  }

  try {
    const companies = await listSuctoCompanies(email, password)
    if (companies.length === 0) {
      return NextResponse.json(
        {
          error:
            'Přihlášení proběhlo, ale účet nemá přístup k žádné firmě. Přihlaste se na moje.sucto.cz a ověřte, že vidíte firmu klienta.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ companies })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Nepodařilo se načíst firmy ze Súčta. Zkontrolujte e-mail a heslo.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
