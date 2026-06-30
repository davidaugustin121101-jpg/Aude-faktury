'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WORKSPACE_CHANGED_EVENT } from '@/components/WorkspaceSwitcher'

type WorkspaceAccounting = {
  connected: boolean
  provider?: 'idoklad' | 'fakturoid'
  label?: string | null
}

type Workspace = {
  id: string
  name: string
  created_at: string
  accounting?: WorkspaceAccounting
}

export default function ClientsPageClient() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const load = () => {
    setLoading(true)
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        setWorkspaces(data.workspaces ?? [])
        setActiveId(data.activeWorkspaceId ?? null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const onChange = () => load()
    window.addEventListener(WORKSPACE_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(WORKSPACE_CHANGED_EVENT, onChange)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Vytvoření selhalo.')
        return
      }
      setNewName('')
      load()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleSwitch = async (id: string) => {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'switch', workspaceId: id }),
    })
    if (res.ok) {
      setActiveId(id)
      window.dispatchEvent(
        new CustomEvent(WORKSPACE_CHANGED_EVENT, { detail: { workspaceId: id } })
      )
      router.refresh()
    }
  }

  const connectionBadge = (acc?: WorkspaceAccounting) => {
    if (!acc?.connected) {
      return (
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
          bez připojení
        </span>
      )
    }
    const name = acc.provider === 'idoklad' ? 'iDoklad' : 'Fakturoid'
    return (
      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
        {name}
        {acc.label ? ` · ${acc.label}` : ''}
      </span>
    )
  }

  if (loading) {
    return <p className="text-gray-500 text-sm">Načítám klienty…</p>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Přidat klienta</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Název firmy klienta"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            {saving ? 'Vytvářím…' : 'Přidat'}
          </button>
        </form>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        <p className="mt-3 text-xs text-gray-400">
          Nový klient začíná bez fakturačního systému — po přepnutí ho připojíš v Nastavení →
          Fakturační systém.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Tvoji klienti</h2>
        <ul className="divide-y divide-gray-100">
          {workspaces.map((ws) => (
            <li key={ws.id} className="py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{ws.name}</p>
                  {activeId === ws.id && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-semibold">
                      aktivní
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Vytvořeno {new Date(ws.created_at).toLocaleDateString('cs-CZ')}
                </p>
                <div className="mt-2">{connectionBadge(ws.accounting)}</div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {activeId !== ws.id && (
                  <button
                    onClick={() => handleSwitch(ws.id)}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Přepnout
                  </button>
                )}
                {activeId === ws.id && !ws.accounting?.connected && (
                  <Link
                    href="/dashboard/settings/accounting"
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    Připojit iDoklad
                  </Link>
                )}
                {activeId === ws.id && ws.accounting?.connected && (
                  <Link
                    href="/dashboard/settings/accounting"
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Upravit připojení
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
