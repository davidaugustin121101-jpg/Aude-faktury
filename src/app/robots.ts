import type { MetadataRoute } from 'next'
import { SEO_LANDING_SLUGS } from '@/content/marketing/seo-landing-pages'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const seoAllows = SEO_LANDING_SLUGS.map((slug) => `/${slug}`)

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/register', '/login', '/obchodni-podminky', '/gdpr', ...seoAllows],
        disallow: [
          '/dashboard',
          '/faktury',
          '/settings',
          '/klienti',
          '/onboarding',
          '/napoveda',
          '/callback',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
