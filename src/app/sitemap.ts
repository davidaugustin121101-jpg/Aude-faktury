import type { MetadataRoute } from 'next'
import { SEO_LANDING_PAGES } from '@/content/marketing/seo-landing-pages'
import {
  HOME_SECTION_ANCHORS,
  PUBLIC_SEO_ROUTES,
  SITEMAP_IMAGES,
  SITE_URL,
} from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const homeImages = SITEMAP_IMAGES.map((img) => `${SITE_URL}${img.url}`)

  const baseEntries: MetadataRoute.Sitemap = PUBLIC_SEO_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      ...(path === '' ? { images: homeImages } : {}),
    })
  )

  const anchorEntries: MetadataRoute.Sitemap = HOME_SECTION_ANCHORS.map(({ hash, priority }) => ({
    url: `${SITE_URL}${hash}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority,
  }))

  const seoLandingEntries: MetadataRoute.Sitemap = SEO_LANDING_PAGES.map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: page.priority,
    images: homeImages,
  }))

  return [...baseEntries, ...anchorEntries, ...seoLandingEntries]
}
