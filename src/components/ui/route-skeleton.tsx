export function PageHeaderSkeleton() {
  return <div className="h-8 w-48 rounded-lg bg-gray-200/80" />
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="h-9 w-9 rounded-lg bg-gray-100" />
          <div className="h-7 w-16 rounded bg-gray-200/80" />
          <div className="h-3 w-24 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl border border-gray-200 bg-white" />
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 rounded-xl border border-gray-200 bg-white" />
      <div className="h-24 rounded-xl border border-gray-200 bg-white" />
      <div className="h-10 w-32 rounded-xl bg-gray-200/80" />
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <ListSkeleton />
    </div>
  )
}

export function FakturyPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <PageHeaderSkeleton />
          <div className="h-4 w-36 rounded bg-gray-100" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-gray-200/80" />
      </div>
      <StatGridSkeleton count={6} />
      <div className="h-9 w-full max-w-md rounded-lg bg-gray-100" />
      <ListSkeleton rows={8} />
    </div>
  )
}

export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeaderSkeleton />
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-xl bg-gray-200/80" />
          <div className="h-10 w-28 rounded-xl bg-gray-200/80" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-gray-200 bg-white" />
        <div className="h-64 rounded-2xl border border-gray-200 bg-white" />
      </div>
    </div>
  )
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="h-10 w-full max-w-xl rounded-lg bg-gray-100" />
      <FormSkeleton />
    </div>
  )
}
