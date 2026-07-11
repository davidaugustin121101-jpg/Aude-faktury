import type { Metadata, Viewport } from 'next'
import { APP_NAME } from '@/lib/brand'
import { LEGAL_EMAIL, LEGAL_WEB } from '@/lib/legal'
import { soloFreeMonthlyLabel } from '@/lib/account-mode'
import { MARKETING_FAQ } from '@/content/marketing/faq'
import {
  API_ACCOUNTING_SYSTEMS,
  ERP_EXPORT_SYSTEMS,
  PRICING_SEO,
  allSeoKeywords,
} from '@/content/marketing/seo-systems'

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://faktury.audeflow.cz'

export const SITE_DESCRIPTION =
  `Nejlevnější vytěžení PDF faktur v ČR — od 2,99 Kč/faktura, ${soloFreeMonthlyLabel()}. Automatické OCR, návrh předkontace 504/343/321 a odeslání do iDokladu, Fakturoidu, SuperFaktury, BitFaktury a Súčta. Export Pohoda XML, Money S3, Helios. E-mail @in.audeflow.cz.`

export const SITE_KEYWORDS = [
  ...allSeoKeywords(),
  'vytěžení faktury',
  'vytěžení PDF faktury',
  'OCR faktura',
  'PDF faktura účetnictví',
  'automatické zpracování faktur',
  'přijaté faktury',
  'BitFaktura API',
  'Súčto API',
  'účetní kód faktura',
  'předkontace faktury',
  '504 343 321',
  'automatizace faktur',
  'faktury pro účetní',
  'účetní kancelář faktury',
  'Audeflow',
  'faktury audeflow',
  'e-mail faktura PDF',
  'zálohová faktura účetnictví',
  'daňový doklad k záloze',
  'kontrola duplicit faktura',
  'ARES IČO faktura',
]

/** Veřejné trasy pro sitemap a interní odkazy */
export const PUBLIC_SEO_ROUTES = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/register', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/login', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/obchodni-podminky', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/gdpr', changeFrequency: 'yearly' as const, priority: 0.3 },
]

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  viewportFit: 'cover',
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} – Vytěžení faktur od 2,99 Kč | iDoklad, Pohoda, Fakturoid`,
    template: `%s | ${APP_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'AUDEFLOW', url: LEGAL_WEB }],
  creator: 'AUDEFLOW',
  publisher: 'AUDEFLOW',
  category: 'finance',
  applicationName: APP_NAME,
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'cs-CZ': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    url: SITE_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} – Nejlevnější vytěžení PDF faktur v ČR`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} – automatické vytěžení faktur od 2,99 Kč`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} – Vytěžení faktur od 2,99 Kč`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(googleVerification
    ? {
        verification: {
          google: googleVerification,
        },
      }
    : {}),
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/manifest.webmanifest',
}

export function pageMetadata(title: string, description: string, path = ''): Metadata {
  const url = `${SITE_URL}${path}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${APP_NAME}`,
      description,
      url,
      type: 'website',
      locale: 'cs_CZ',
      siteName: APP_NAME,
      images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: APP_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${APP_NAME}`,
      description,
      images: ['/og-image.svg'],
    },
  }
}

function supportedSystemsItemList() {
  const apiItems = API_ACCOUNTING_SYSTEMS.map((s, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'SoftwareApplication',
      name: `${APP_NAME} → ${s.name}`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: s.description,
      url: `${SITE_URL}/#integrace-${s.slug}`,
    },
  }))
  const erpItems = ERP_EXPORT_SYSTEMS.map((s, i) => ({
    '@type': 'ListItem',
    position: API_ACCOUNTING_SYSTEMS.length + i + 1,
    item: {
      '@type': 'SoftwareApplication',
      name: `${APP_NAME} → export ${s.name}`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: s.description,
      url: `${SITE_URL}/#export-${s.slug}`,
    },
  }))
  return {
    '@type': 'ItemList',
    name: 'Podporované účetní a fakturační systémy',
    itemListElement: [...apiItems, ...erpItems],
  }
}

export function landingJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: APP_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'cs-CZ',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'AUDEFLOW',
        url: LEGAL_WEB,
        email: LEGAL_EMAIL,
        logo: `${SITE_URL}/icon.svg`,
        sameAs: [LEGAL_WEB],
      },
      {
        '@type': 'SoftwareApplication',
        name: APP_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [
          {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'CZK',
            description: PRICING_SEO.free,
          },
          {
            '@type': 'Offer',
            price: '299',
            priceCurrency: 'CZK',
            description: PRICING_SEO.pack,
          },
          {
            '@type': 'Offer',
            price: '2.99',
            priceCurrency: 'CZK',
            description: `Cena za fakturu od ${PRICING_SEO.perInvoice}`,
          },
        ],
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        inLanguage: ['cs-CZ'],
        featureList: [
          'Automatické vytěžení PDF faktur (OCR/AI)',
          'E-mailový vstup @in.audeflow.cz',
          'Návrh českého účetního kódu a předkontace MD/DAL',
          'Odeslání do iDoklad, Fakturoid, SuperFaktura, BitFaktura, Súčto',
          'Export Pohoda XML, Money S3, Helios CSV/XML',
          'Kontrola duplicit, ARES, audit DPH',
          'Položková extrakce a split předkontace',
          'Zálohové faktury a daňové doklady',
        ],
      },
      supportedSystemsItemList(),
      {
        '@type': 'FAQPage',
        mainEntity: MARKETING_FAQ.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  }
}
