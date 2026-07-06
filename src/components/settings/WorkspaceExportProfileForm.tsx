'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type ExportProfileForm = {
  export_company_ico: string
  export_default_account_code: string
  export_cost_center: string
  export_contract_code: string
  export_money_document_type: string
  export_helios_variant: 'red' | 'inuvio'
}

const empty: ExportProfileForm = {
  export_company_ico: '',
  export_default_account_code: '',
  export_cost_center: '',
  export_contract_code: '',
  export_money_document_type: 'FP',
  export_helios_variant: 'red',
}

interface Props {
  workspaceId: string
  workspaceName: string
}

export function WorkspaceExportProfileForm({ workspaceId, workspaceName }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ExportProfileForm>(empty)

  useEffect(() => {
    fetch(`/api/workspaces/export-profile?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile) {
          setForm({
            export_company_ico: profile.export_company_ico ?? '',
            export_default_account_code: profile.export_default_account_code ?? '',
            export_cost_center: profile.export_cost_center ?? '',
            export_contract_code: profile.export_contract_code ?? '',
            export_money_document_type: profile.export_money_document_type ?? 'FP',
            export_helios_variant: profile.export_helios_variant === 'inuvio' ? 'inuvio' : 'red',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [workspaceId])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/workspaces/export-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, ...form }),
    })
    setSaving(false)
    if (res.ok) toast.success(`Export profil uložen — ${workspaceName}`)
    else toast.error('Uložení se nezdařilo')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium text-gray-900">Export profil — {workspaceName}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ['export_company_ico', 'IČO firmy (Pohoda dataPack)'],
            ['export_default_account_code', 'Výchozí účetní kód'],
            ['export_cost_center', 'Středisko (Helios STRED)'],
            ['export_contract_code', 'Zakázka (Helios STRED2)'],
            ['export_money_document_type', 'Money typ dokladu'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-xs text-gray-500">{label}</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="block">
          <span className="text-xs text-gray-500">Helios varianta</span>
          <select
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            value={form.export_helios_variant}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                export_helios_variant: e.target.value as 'red' | 'inuvio',
              }))
            }
          >
            <option value="red">Helios Red (CSV)</option>
            <option value="inuvio">Helios iNuvio (XML)</option>
          </select>
        </label>
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Uložit export profil
      </Button>
    </div>
  )
}
