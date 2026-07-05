import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { ExportProfileSettingsSection } from '@/components/settings/ExportProfileSettingsSection'

export default async function ExportSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export profil</h1>
          <p className="text-sm text-gray-500 mt-1">
            IČO firmy, středisko a typ dokladu pro export do Pohody, Money S3 a Helios.
          </p>
        </div>
        <SettingsNav />
      </div>

      <div id="pohoda" className="scroll-mt-24">
        <ExportProfileSettingsSection />
      </div>

      <div id="money" className="scroll-mt-24 pt-2">
        <p className="text-xs text-gray-500 px-1">
          Pro Money S3 nastavte typ dokladu (FP) v export profilu výše.
        </p>
      </div>

      <div id="helios" className="scroll-mt-24 pt-2">
        <p className="text-xs text-gray-500 px-1">
          Pro Helios Red / iNuvio nastavte středisko a zakázku (STRED / STRED2) v export profilu výše.
        </p>
      </div>

      <p className="text-xs text-gray-500 px-1">
        Podrobné návody k exportu najdete v{' '}
        <Link href="/napoveda" className="text-blue-600 hover:underline">
          Nápovědě
        </Link>
        .
      </p>
    </div>
  )
}
