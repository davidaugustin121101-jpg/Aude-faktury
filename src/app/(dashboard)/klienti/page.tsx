import { ClientsPageClient } from './clients-page-client'

export default function KlientiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Klienti</h1>
        <p className="text-sm text-gray-500 mt-1">
          Režim pro účetní firmy — spravujte více firem z jednoho účtu.
        </p>
      </div>
      <ClientsPageClient />
    </div>
  )
}
