'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { WORKSPACE_CHANGED_EVENT } from '@/components/layout/workspace-switcher'
import { ACCOUNTANT_PRICE } from '@/lib/account-mode'
import { CheckCircle2, Link2, Plus, Users, Lock } from 'lucide-react'
import { toast } from 'sonner'

type WorkspaceAccounting = {
  connected: boolean
  provider?: 'idoklad' | 'fakturoid' | 'superfaktura'
  label?: string | null
}

type Workspace = {
  id: string
  name: string
  created_at: string
  accounting?: WorkspaceAccounting
}

const PROVIDER_NAMES = {
  idoklad: 'iDoklad',
  fakturoid: 'Fakturoid',
  superfaktura: 'SuperFaktura',
}

export function ClientsPageClient() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isAccountant, setIsAccountant] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const load = () => {
    setLoading(true)
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        setWorkspaces(data.workspaces ?? [])
        setActiveId(data.activeWorkspaceId ?? null)
        setIsAccountant(data.isAccountant ?? false)
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
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Vytvoření selhalo')
        return
      }
      setNewName('')
      toast.success('Klient vytvořen')
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
      toast.success('Klient přepnut')
      router.refresh()
    }
  }

  if (loading) {
    return <p className="text-gray-500 text-sm">Načítám klienty…</p>
  }

  if (!isAccountant) {
    return (
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-8">
        <div className="flex items-start gap-4 max-w-xl">
          <div className="h-12 w-12 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Režim pro účetní firmy</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Spravujte neomezený počet klientů z jednoho účtu. Každý klient má vlastní faktury a
              vlastní fakturační systém (iDoklad, Fakturoid nebo SuperFaktura).
            </p>
            <p className="text-sm font-semibold text-violet-700 mt-4">{ACCOUNTANT_PRICE}</p>
            <Link href="/settings/predplatne">
              <Button size="sm" className="mt-4 bg-violet-600 hover:bg-violet-700">
                Aktivovat režim účetní firmy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-sm text-violet-900">
        <div className="flex items-center gap-2 font-medium">
          <Users className="h-4 w-4" />
          Režim účetní firmy je aktivní
        </div>
        <p className="mt-1 text-violet-700">
          Každý klient = jeden fakturační systém. Po přepnutí klienta nastavte systém v sekci
          Fakturační systém.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Přidat klienta</h2>
        <p className="text-xs text-gray-500 mb-4">
          Nový klient začíná bez fakturačního systému — po přepnutí ho připojíte v Fakturační
          systém.
        </p>
        <form onSubmit={handleCreate} className="flex gap-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Název firmy klienta"
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={saving || !newName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            {saving ? 'Vytvářím…' : 'Přidat'}
          </Button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Vaši klienti</h2>
        </div>
        {workspaces.map((ws) => (
          <div key={ws.id} className="px-6 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{ws.name}</p>
                {activeId === ws.id && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">
                    aktivní
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Vytvořeno {new Date(ws.created_at).toLocaleDateString('cs-CZ')}
              </p>
              <div className="mt-2">
                {ws.accounting?.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    {PROVIDER_NAMES[ws.accounting.provider ?? 'idoklad']}
                    {ws.accounting.label ? ` · ${ws.accounting.label}` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                    <Link2 className="h-3 w-3" />
                    bez připojení
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {activeId !== ws.id && (
                <Button variant="outline" size="sm" onClick={() => handleSwitch(ws.id)}>
                  Přepnout
                </Button>
              )}
              {!ws.accounting?.connected && activeId === ws.id && (
                <Link href="/settings/accounting">
                  <Button size="sm" variant="secondary" className="w-full">
                    Připojit systém
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
