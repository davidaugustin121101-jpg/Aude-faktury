import DropZone from '@/components/DropZone'

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Nahrát fakturu</h1>
      <p className="text-gray-500 mb-8">
        Přetáhni jednu nebo více PDF faktur. Claude je přečte a připraví do fronty ke schválení.
      </p>
      <DropZone batch />
    </div>
  )
}
