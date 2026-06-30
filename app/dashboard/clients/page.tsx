import ClientsPageClient from './ClientsPageClient'

export default function ClientsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Klienti</h1>
      <p className="text-gray-500 text-sm mb-6">
        Režim pro účetní — spravuj více firem z jednoho účtu.
      </p>
      <ClientsPageClient />
    </div>
  )
}
