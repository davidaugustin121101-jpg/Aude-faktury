import type { MetadataRoute } from 'next'
import { PUBLIC_SEO_ROUTES, SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return PUBLIC_SEO_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
