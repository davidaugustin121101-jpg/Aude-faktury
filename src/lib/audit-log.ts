import { createAdminClient } from '@/lib/supabase/admin'

type AuditAction = 'received' | 'extracted' | 'approved' | 'sent' | 'rejected' | 'error' | 'auto_approved'

export async function insertAuditLog(entry: {
  invoice_id: string
  user_id: string
  action: AuditAction
  details?: Record<string, unknown>
}) {
  const admin = createAdminClient()
  const { error } = await admin.from('invoice_audit_log').insert(entry)
  if (error) {
    console.error('[audit-log] insert failed:', error.message)
  }
}
