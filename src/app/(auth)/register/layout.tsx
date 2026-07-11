import type { Metadata } from 'next'
import { Suspense } from 'react'
import { soloFreeMonthlyLabel } from '@/lib/account-mode'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  'Registrace zdarma',
  `Vytvořte účet Faktury Audeflow — ${soloFreeMonthlyLabel()}, od 2,99 Kč/faktura. Vytěžení PDF, předkontace, export do iDokladu, Fakturoidu, Pohody, BitFaktury a Súčta.`,
  '/register'
)

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
