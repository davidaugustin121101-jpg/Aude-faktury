import type { Metadata } from 'next'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { OCHRANA_UDAJU } from '@/content/legal/ochrana-udaju'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  'Ochrana osobních údajů',
  'Zásady ochrany osobních údajů služby Faktury Audeflow (AUDEFLOW, IČO 10841067).',
  '/ochrana-udaju'
)

export default function OchranaUdajuPage() {
  return <LegalDocumentLayout title="Ochrana osobních údajů" sections={OCHRANA_UDAJU} />
}
