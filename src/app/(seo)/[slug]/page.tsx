import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/json-ld'
import { SeoLandingPageView } from '@/components/marketing/SeoLandingPageView'
import {
  SEO_LANDING_SLUGS,
  getSeoLandingPage,
} from '@/content/marketing/seo-landing-pages'
import { pageMetadata, seoLandingJsonLd } from '@/lib/seo'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return SEO_LANDING_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = getSeoLandingPage(slug)
  if (!page) return {}

  return {
    ...pageMetadata(page.title, page.description, `/${page.slug}`),
    keywords: page.keywords,
  }
}

export default async function SeoLandingRoute({ params }: PageProps) {
  const { slug } = await params
  const page = getSeoLandingPage(slug)
  if (!page) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      <JsonLd data={seoLandingJsonLd(page)} />
      <SeoLandingPageView page={page} isAuthenticated={!!user} />
    </>
  )
}
