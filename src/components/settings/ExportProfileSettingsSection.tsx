'use client'

import { Loader2 } from 'lucide-react'
import { WorkspaceExportProfileForm } from './WorkspaceExportProfileForm'

interface Props {
  workspaceId: string
  workspaceName: string
}

export function ExportProfileSettingsSection({ workspaceId, workspaceName }: Props) {
  if (!workspaceId) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <WorkspaceExportProfileForm workspaceId={workspaceId} workspaceName={workspaceName} />
    </div>
  )
}
