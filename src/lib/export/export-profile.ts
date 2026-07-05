import type { SupabaseClient } from '@supabase/supabase-js'
import type { CountryCode, ExportProfile } from './types'

type WorkspaceExportRow = {
  export_company_ico?: string | null
  export_default_account_code?: string | null
  export_cost_center?: string | null
  export_contract_code?: string | null
  export_money_document_type?: string | null
  export_helios_variant?: string | null
  export_country?: string | null
}

export function mapWorkspaceExportProfile(row: WorkspaceExportRow | null): ExportProfile {
  if (!row) return {}
  return {
    companyIco: row.export_company_ico,
    defaultAccountCode: row.export_default_account_code,
    costCenter: row.export_cost_center,
    contractCode: row.export_contract_code,
    moneyDocumentType: row.export_money_document_type,
    heliosVariant: row.export_helios_variant === 'inuvio' ? 'inuvio' : 'red',
    country: row.export_country === 'sk' ? 'sk' : row.export_country === 'cz' ? 'cz' : undefined,
  }
}

export async function loadExportProfileForInvoice(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined
): Promise<ExportProfile> {
  if (!workspaceId) return {}

  const { data } = await supabase
    .from('workspaces')
    .select(
      'export_company_ico, export_default_account_code, export_cost_center, export_contract_code, export_money_document_type, export_helios_variant, export_country'
    )
    .eq('id', workspaceId)
    .maybeSingle()

  return mapWorkspaceExportProfile(data as WorkspaceExportRow | null)
}

export function mergeExportProfile(
  workspaceProfile: ExportProfile,
  userCountry?: CountryCode | null
): ExportProfile {
  return {
    ...workspaceProfile,
    country: workspaceProfile.country ?? userCountry ?? 'cz',
  }
}
