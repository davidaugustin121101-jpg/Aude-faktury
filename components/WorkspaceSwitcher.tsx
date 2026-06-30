'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export const WORKSPACE_CHANGED_EVENT = 'audeflow:workspace-changed'

type Workspace = { id: string; name: string }

export default function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeName, setActiveName] = useState<string>('')
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
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-500">Načítám klienta…</p>
      </div>
    )
  }

  const showSwitcher = isAccountant || workspaces.length > 1

  if (!showSwitcher) {
    return activeName ? (
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-500">Firma</p>
        <p className="text-sm text-white font-medium truncate">{activeName}</p>
      </div>
    ) : null
  }

  return (
    <div className="px-4 pb-3 border-b border-gray-800 mb-2">
      <label className="block text-xs text-gray-500 mb-1.5">
        {isAccountant ? 'Aktivní klient' : 'Firma'}
      </label>
      <select
        value={activeId ?? ''}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={switching}
        className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>
      {switching && <p className="text-xs text-gray-500 mt-1">Přepínám klienta…</p>}
      {isAccountant && (
        <p className="text-[10px] text-gray-500 mt-2 leading-snug">
          Každý klient má vlastní faktury a vlastní iDoklad/Fakturoid.
        </p>
      )}
    </div>
  )
}
