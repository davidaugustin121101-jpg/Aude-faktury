import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  'Přihlášení',
  'Přihlaste se do Faktury Audeflow — vytěžení PDF faktur a export do účetnictví.',
  '/login'
)

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
