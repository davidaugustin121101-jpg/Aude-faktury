import type { Metadata, Viewport } from 'next'
import { APP_NAME } from '@/lib/brand'

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://faktury.audeflow.cz'

export const SITE_DESCRIPTION =
  'Automatické vytěžení PDF faktur a odeslání do iDokladu, Fakturoidu nebo SuperFaktury. Export ISDOC, Pohoda XML, Money S3 a Helios. Pro OSVČ, firmy i účetní kanceláře v ČR.'

export const SITE_KEYWORDS = [
  'vytěžení faktury',
  'OCR faktura',
  'PDF faktura účetnictví',
  'iDoklad API',
  'Fakturoid náklady',
  'SuperFaktura',
  'ISDOC export',
  'Pohoda import faktury',
  'Money S3 faktura',
  'Helios faktura',
  'účetní kód faktura',
  'automatizace faktur',
  'přijaté faktury',
  'faktury pro účetní',
  'Audeflow',
  'faktury audeflow',
]

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
    default: `${APP_NAME} – Vytěžení PDF faktur a export do účetnictví`,
    template: `%s | ${APP_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'AUDEFLOW', url: 'https://audeflow.cz' }],
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
  },
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    url: SITE_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} – PDF faktura do účetnictví za 30 sekund`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} – automatické vytěžení faktur`,
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
        url: 'https://audeflow.cz',
        email: 'kontakt@audeflow.cz',
        logo: `${SITE_URL}/icon.svg`,
      },
      {
        '@type': 'SoftwareApplication',
        name: APP_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CZK',
          description: 'Solo režim – 10 faktur měsíčně zdarma',
        },
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        inLanguage: ['cs'],
        featureList: [
          'Vytěžení PDF faktur',
          'Návrh českého účetního kódu',
          'Odeslání do iDoklad, Fakturoid, SuperFaktura',
          'Export ISDOC, Pohoda, Money S3, Helios',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Jak funguje vytěžení faktury v Audeflow?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Nahrajete PDF fakturu, systém automaticky načte dodavatele, IČO, částky, DPH a navrhne účetní kód. Poté exportujete soubor nebo odešlete do připojeného fakturačního systému.',
            },
          },
          {
            '@type': 'Question',
            name: 'Které fakturační systémy podporujete?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'API napojení: iDoklad, Fakturoid, SuperFaktura. Export souborů: ISDOC, Pohoda XML, Money S3, Helios Red a Helios iNuvio.',
            },
          },
          {
            '@type': 'Question',
            name: 'Je Audeflow vhodný pro účetní firmy?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ano. Účetní režim umožňuje spravovat více klientů — každý klient má vlastní workspace a vlastní napojení na fakturační systém.',
            },
          },
        ],
      },
    ],
  }
}
