import type { Metadata } from 'next'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { OBCHODNI_PODMINKY } from '@/content/legal/obchodni-podminky'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  'Obchodní podmínky',
  'Obchodní podmínky služby Faktury Audeflow — vytěžení PDF faktur a export do účetnictví v ČR.',
  '/obchodni-podminky'
)

export default function ObchodniPodminkyPage() {
  return <LegalDocumentLayout title="Obchodní podmínky" sections={OBCHODNI_PODMINKY} />
}
