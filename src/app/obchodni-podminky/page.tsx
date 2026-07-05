import type { Metadata } from 'next'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { OBCHODNI_PODMINKY } from '@/content/legal/obchodni-podminky'

export const metadata: Metadata = {
  title: 'Obchodní podmínky',
  robots: { index: true, follow: true },
}

export default function ObchodniPodminkyPage() {
  return <LegalDocumentLayout title="Obchodní podmínky" sections={OBCHODNI_PODMINKY} />
}
