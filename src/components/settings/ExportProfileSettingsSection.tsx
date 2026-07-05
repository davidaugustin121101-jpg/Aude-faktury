'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { WorkspaceExportProfileForm } from './WorkspaceExportProfileForm'

export function ExportProfileSettingsSection() {
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        const ws = (data.workspaces ?? []).find(
          (w: { id: string }) => w.id === data.activeWorkspaceId
        )
        if (ws) setActive({ id: ws.id, name: ws.name })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!active) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <WorkspaceExportProfileForm workspaceId={active.id} workspaceName={active.name} />
    </div>
  )
}
