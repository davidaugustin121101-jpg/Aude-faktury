'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { APP_NAME } from '@/lib/brand'
import { getPostAuthUploadPath, hasPendingPdf } from '@/lib/pending-upload'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasPending = searchParams.get('pending') === '1'
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Nejdřív zadejte e-mail')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/callback?next=/settings`,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Odkaz pro obnovení hesla jsme poslali na e-mail')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Přihlášení se nepodařilo dokončit. Zkuste to znovu.')
      setLoading(false)
      return
    }

    const pending = await hasPendingPdf()
    router.push(pending ? getPostAuthUploadPath() : '/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🧾
            </span>
            <span className="font-bold text-xl text-gray-900">{APP_NAME}</span>
          </Link>
        </div>
        <Card className="shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Přihlásit se</CardTitle>
            <CardDescription>
              {hasPending
                ? 'Faktura je uložena — po přihlášení ji hned zpracujeme.'
                : 'Zadejte své přihlašovací údaje'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Heslo</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Zapomněli jste heslo?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Přihlásit se
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Nemáte účet?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Registrovat se
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
