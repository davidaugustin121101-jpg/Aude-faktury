import { Suspense } from 'react'
import AccountingSettingsClient from './AccountingSettingsClient'

export default function AccountingSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-gray-500 text-sm">Načítám nastavení fakturačního systému…</div>
      }
    >
      <AccountingSettingsClient />
    </Suspense>
  )
}
