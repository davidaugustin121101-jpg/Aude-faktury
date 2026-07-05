'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CountryCode } from '@/lib/accounting-codes'
import { COUNTRY_LABELS } from '@/lib/accounting-codes'
import { APP_NAME } from '@/lib/brand'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState<CountryCode>('cz')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Heslo musí mít alespoň 8 znaků')
      return
    }

    setLoading(true)

    const redirectTo = `${window.location.origin}/callback?next=/faktury/upload`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { country },
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      setLoading(false)
      if (error.message.includes('Invalid path specified')) {
        toast.error(
          'Chybná Supabase URL na serveru. Ve Vercelu nastavte NEXT_PUBLIC_SUPABASE_URL na https://rddjtylcmxsnxhwjlvaj.supabase.co (bez /rest/v1).'
        )
      } else {
        toast.error(error.message)
      }
      return
    }

    if (!data.session) {
      setLoading(false)
      toast.success('Ověřte e-mail – poslali jsme vám potvrzovací odkaz.')
      return
    }

    await fetch('/api/user/country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country }),
    })

    setLoading(false)
    toast.success(
      country === 'sk'
        ? 'Účet vytvorený – nastavené Slovensko 🇸🇰'
        : 'Účet vytvořen – nastaveno Česko 🇨🇿'
    )
    router.push('/faktury/upload')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🧾
            </span>
            <span className="font-bold text-xl text-gray-900">{APP_NAME}</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Vytvořit účet zdarma</h1>
          <p className="text-sm text-gray-500 mb-6">10 faktur měsíčně zdarma · Bez kreditní karty</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label className="mb-2 block">Země účetnictví</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['cz', 'sk'] as CountryCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCountry(code)}
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-all',
                      country === code
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    )}
                  >
                    <span className="text-lg">{code === 'cz' ? '🇨🇿' : '🇸🇰'}</span>
                    <p className="text-xs font-semibold text-gray-900 mt-1">{COUNTRY_LABELS[code]}</p>
                    <p className="text-[10px] text-gray-500">
                      {code === 'cz' ? 'DPH 0/12/21 %' : 'DPH 0/10/20 % · EUR'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder={country === 'sk' ? 'jan@firma.sk' : 'jan@firma.cz'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimálně 8 znaků"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Registrovat se zdarma
            </Button>
          </form>

          <ul className="mt-5 space-y-1.5">
            {(country === 'sk'
              ? [
                  '10 faktúr zdarma každý mesiac',
                  'PDF drag & drop',
                  'SuperFaktúra · slovenské účtovné kódy',
                ]
              : [
                  '10 faktur zdarma každý měsíc',
                  'PDF drag & drop',
                  'iDoklad · Fakturoid · SuperFaktura',
                ]
            ).map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-500 text-center mt-4">
          Už máte účet?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Přihlásit se
          </Link>
        </p>
      </div>
    </div>
  )
}
