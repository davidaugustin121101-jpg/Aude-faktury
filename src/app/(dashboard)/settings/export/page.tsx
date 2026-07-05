import { redirect } from 'next/navigation'
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

      <p className="text-xs text-gray-500 px-1">
        Podrobné návody k exportu najdete v{' '}
        <a href="/napoveda" className="text-blue-600 hover:underline">
          Nápovědě
        </a>
        .
      </p>
    </div>
  )
}
