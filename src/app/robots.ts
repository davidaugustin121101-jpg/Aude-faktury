import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/register', '/login', '/obchodni-podminky', '/ochrana-udaju'],
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
