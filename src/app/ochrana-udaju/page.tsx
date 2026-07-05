import type { Metadata } from 'next'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { OCHRANA_UDAJU } from '@/content/legal/ochrana-udaju'

export const metadata: Metadata = {
  title: 'Ochrana osobních údajů',
  robots: { index: true, follow: true },
}

export default function OchranaUdajuPage() {
  return <LegalDocumentLayout title="Ochrana osobních údajů" sections={OCHRANA_UDAJU} />
}
