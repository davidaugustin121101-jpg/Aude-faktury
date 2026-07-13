import type { Metadata, Viewport } from 'next'
import { APP_NAME } from '@/lib/brand'
import { LEGAL_EMAIL, LEGAL_WEB } from '@/lib/legal'
import { soloFreeMonthlyLabel } from '@/lib/account-mode'
import { MARKETING_FAQ } from '@/content/marketing/faq'
import { LANDING_DEMO_CHAPTERS, getLandingDemoVideo } from '@/content/marketing/demo-video'
import { SEO_LANDING_PAGES } from '@/content/marketing/seo-landing-pages'
import type { SeoLandingPage } from '@/content/marketing/seo-landing-pages'
import {
  API_ACCOUNTING_SYSTEMS,
  ERP_EXPORT_SYSTEMS,
  PRICING_SEO,
  allSeoKeywords,
} from '@/content/marketing/seo-systems'

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://audeflow.cz'

export const SITE_DESCRIPTION =
  `Nejlevnější vytěžení PDF faktur v ČR — od 2,99 Kč/faktura, ${soloFreeMonthlyLabel()}. Automatické OCR, návrh předkontace 504/343/321 a odeslání do iDokladu, Fakturoidu, SuperFaktury, BitFaktury a Súčta. Export Pohoda XML, Money S3, Helios. E-mail @in.audeflow.cz.`

const COMPETITOR_AND_MARKET_KEYWORDS = [
  'alternativa čtení faktur',
  'ctenifaktur alternativa',
  'digitoo alternativa',
  'flowis alternativa',
  'vytěžení faktur srovnání',
  'nejlepší vytěžení faktur ČR',
  'software na faktury',
  'program na faktury',
  'čtení faktur online',
  'extrakce dat z faktury',
  'parsování faktury',
  'ISDOC faktura',
  'stormware pohoda faktura',
  'money s3 přijaté faktury',
  'helios přijaté faktury',
  'idoklad přijaté faktury',
  'fakturoid výdaje',
  'superfaktura náklady',
  'bitfaktura výdaje',
  'súčto doklady',
  'audeflow.cz',
  'faktury audeflow cz',
] as const

export const SITE_KEYWORDS = [
  ...allSeoKeywords(),
  ...SEO_LANDING_PAGES.flatMap((p) => p.keywords),
  ...COMPETITOR_AND_MARKET_KEYWORDS,
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

/** Obrázky pro image sitemap */
export const SITEMAP_IMAGES = [
  { url: '/og-image.png', title: `${APP_NAME} — AF logo`, caption: APP_NAME },
  { url: '/icon-512.png', title: `${APP_NAME} logo`, caption: APP_NAME },
] as const

/** Kotvy na hlavním landingu — interní odkazy a sitemap */
export const HOME_SECTION_ANCHORS = [
  { hash: '#uvod', priority: 0.85 },
  { hash: '#video', priority: 0.75 },
  { hash: '#jak-funguje', priority: 0.8 },
  { hash: '#pricing', priority: 0.85 },
  { hash: '#recenze', priority: 0.7 },
  { hash: '#faq', priority: 0.8 },
  { hash: '#o-nas', priority: 0.65 },
  { hash: '#integrace-idoklad', priority: 0.78 },
  { hash: '#integrace-fakturoid', priority: 0.78 },
  { hash: '#integrace-superfaktura', priority: 0.75 },
  { hash: '#integrace-bitfaktura', priority: 0.75 },
  { hash: '#integrace-sucto', priority: 0.75 },
  { hash: '#export-pohoda', priority: 0.78 },
  { hash: '#export-money-s3', priority: 0.75 },
  { hash: '#export-helios', priority: 0.75 },
] as const

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
    default: `${APP_NAME} – Vytěžení faktur od 2,99 Kč | iDoklad, Pohoda, Fakturoid, OCR`,
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
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Audeflow — logo AF',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} – Vytěžení faktur od 2,99 Kč`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
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
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icon.svg', color: '#2563eb' },
    ],
  },
  manifest: '/manifest.webmanifest',
  other: {
    'msapplication-config': '/browserconfig.xml',
    'msapplication-TileColor': '#2563eb',
    'msapplication-TileImage': '/icon-192.png',
  },
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
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Audeflow', type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${APP_NAME}`,
      description,
      images: ['/og-image.png'],
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

function howToExtractInvoiceJsonLd() {
  return {
    '@type': 'HowTo',
    name: 'Jak vytěžit PDF fakturu v Audeflow',
    description: 'Postup od nahrání PDF přes vytěžení a audit až po export do účetnictví.',
    inLanguage: 'cs-CZ',
    step: LANDING_DEMO_CHAPTERS.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: text,
      text,
    })),
  }
}

function demoVideoJsonLd() {
  const video = getLandingDemoVideo()
  if (!video) return null

  const contentUrl =
    video.provider === 'youtube'
      ? `https://www.youtube.com/watch?v=${video.src}`
      : video.provider === 'vimeo'
        ? `https://vimeo.com/${video.src}`
        : `${SITE_URL}${video.src}`

  const thumbnailUrl =
    video.poster
      ? `${SITE_URL}${video.poster}`
      : video.provider === 'youtube'
        ? `https://i.ytimg.com/vi/${video.src}/hqdefault.jpg`
        : `${SITE_URL}/og-image.png`

  return {
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    contentUrl,
    thumbnailUrl,
    uploadDate: '2026-01-01',
    inLanguage: 'cs-CZ',
  }
}

export function seoLandingJsonLd(page: SeoLandingPage) {
  const pageUrl = `${SITE_URL}/${page.slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}/#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        inLanguage: 'cs-CZ',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#software` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Domů', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: page.h1, item: pageUrl },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.sections.map((s) => ({
          '@type': 'Question',
          name: s.heading,
          acceptedAnswer: { '@type': 'Answer', text: s.body },
        })),
      },
    ],
  }
}

export function landingJsonLd() {
  const videoLd = demoVideoJsonLd()
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: APP_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'cs-CZ',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/vytezeni-faktur`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'AUDEFLOW',
      url: LEGAL_WEB,
      email: LEGAL_EMAIL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
      sameAs: [LEGAL_WEB, SITE_URL],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: APP_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: [
        {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CZK',
          description: PRICING_SEO.free,
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/register`,
        },
        {
          '@type': 'Offer',
          price: '299',
          priceCurrency: 'CZK',
          description: PRICING_SEO.pack,
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/#pricing`,
        },
        {
          '@type': 'Offer',
          price: '2.99',
          priceCurrency: 'CZK',
          description: `Cena za fakturu od ${PRICING_SEO.perInvoice}`,
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/nejlevnejsi-vytezeni-faktur`,
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
    howToExtractInvoiceJsonLd(),
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
    {
      '@type': 'ItemList',
      name: 'SEO průvodce vytěžením faktur',
      itemListElement: SEO_LANDING_PAGES.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'WebPage',
          name: p.h1,
          url: `${SITE_URL}/${p.slug}`,
          description: p.description,
        },
      })),
    },
  ]

  if (videoLd) graph.push(videoLd)

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
