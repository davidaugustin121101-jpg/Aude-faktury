import type { Metadata, Viewport } from 'next'
import { APP_NAME } from '@/lib/brand'
import { LEGAL_EMAIL, LEGAL_WEB } from '@/lib/legal'
import { MARKETING_FAQ } from '@/content/marketing/faq'

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://faktury.audeflow.cz'

export const SITE_DESCRIPTION =
  'Automatické vytěžení PDF faktur, návrh předkontace a odeslání do iDokladu, Fakturoidu nebo SuperFaktury. Export ISDOC, Pohoda XML, Money S3 a Helios. E-mailový vstup @in.audeflow.cz. Pro OSVČ, firmy i účetní kanceláře v ČR.'

export const SITE_KEYWORDS = [
  'vytěžení faktury',
  'vytěžení PDF faktury',
  'OCR faktura',
  'PDF faktura účetnictví',
  'automatické zpracování faktur',
  'přijaté faktury',
  'iDoklad API',
  'iDoklad import faktury',
  'Fakturoid náklady',
  'SuperFaktura faktura',
  'ISDOC export',
  'Pohoda import faktury',
  'Pohoda XML faktura',
  'Money S3 faktura',
  'Helios faktura',
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
    default: `${APP_NAME} – Vytěžení PDF faktur a export do účetnictví | Audeflow`,
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
    title: `${APP_NAME} – PDF faktura do účetnictví za minutu`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} – automatické vytěžení faktur pro ČR`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} – Vytěžení faktur pro ČR`,
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
            description: '10 faktur měsíčně zdarma',
          },
          {
            '@type': 'Offer',
            price: '299',
            priceCurrency: 'CZK',
            description: '100 faktur — kredit bez expirace',
          },
        ],
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        inLanguage: ['cs-CZ'],
        featureList: [
          'Vytěžení PDF faktur',
          'E-mailový vstup @in.audeflow.cz',
          'Návrh českého účetního kódu a předkontace',
          'Odeslání do iDoklad, Fakturoid, SuperFaktura',
          'Export ISDOC, Pohoda, Money S3, Helios',
          'Kontrola duplicit a ARES',
        ],
      },
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
