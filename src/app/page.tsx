import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/marketing/landing-page'
import { JsonLd } from '@/components/seo/json-ld'
import { landingJsonLd } from '@/lib/seo'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <>
      <JsonLd data={landingJsonLd()} />
      <LandingPage />
    </>
  )
}
