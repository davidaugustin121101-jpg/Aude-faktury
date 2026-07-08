import type { Metadata } from 'next'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { OCHRANA_UDAJU } from '@/content/legal/ochrana-udaju'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  'GDPR — Ochrana osobních údajů',
  'Zásady ochrany osobních údajů (GDPR) služby Faktury Audeflow — zpracování, práva subjektů, zpracovatelé.',
  '/gdpr'
)

export default function GdprPage() {
  return (
    <LegalDocumentLayout title="GDPR — Ochrana osobních údajů" sections={OCHRANA_UDAJU} />
  )
}
