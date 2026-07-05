'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, ChevronDown } from 'lucide-react'

export const WORKSPACE_CHANGED_EVENT = 'audeflow:workspace-changed'

type Workspace = { id: string; name: string }

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeName, setActiveName] = useState('')
  const [isAccountant, setIsAccountant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const router = useRouter()

  const load = useCallback(() => {
    return fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        setWorkspaces(data.workspaces ?? [])
        setActiveId(data.activeWorkspaceId ?? null)
        setActiveName(data.activeWorkspaceName ?? '')
        setIsAccountant(data.isAccountant ?? false)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSwitch = async (id: string) => {
    if (id === activeId || switching) return
    setSwitching(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch', workspaceId: id }),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveId(id)
        setActiveName(data.workspace?.name ?? workspaces.find((w) => w.id === id)?.name ?? '')
        window.dispatchEvent(
          new CustomEvent(WORKSPACE_CHANGED_EVENT, { detail: { workspaceId: id } })
        )
        router.refresh()
      }
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-gray-400">Načítám klienty…</p>
      </div>
    )
  }

  if (!isAccountant) {
    return null
  }

  return (
    <div className="mx-3 mb-3 px-3 py-2.5 bg-violet-50 rounded-lg border border-violet-100">
      <label className="flex items-center gap-1.5 text-[10px] text-violet-600 uppercase tracking-wide mb-1.5">
        <Building2 className="h-3 w-3" />
        Aktivní klient
      </label>
      <div className="relative">
        <select
          value={activeId ?? ''}
          onChange={(e) => handleSwitch(e.target.value)}
          disabled={switching}
          className={cn(
            'w-full appearance-none bg-white border border-violet-200 text-gray-900 text-sm rounded-lg px-3 py-2 pr-8',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60'
          )}
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400 pointer-events-none" />
      </div>
      <p className="text-[10px] text-violet-600/80 mt-1.5 leading-snug">
        Každý klient = jeden fakturační systém.
      </p>
    </div>
  )
}
