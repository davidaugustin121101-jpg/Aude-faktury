import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProcessedInvoice } from '@/types/invoices'
import { INVOICE_ACTIONABLE_STATUSES } from '@/types/invoices'
import { FieldRow, ConfidenceBadge } from '@/components/invoices/ConfidenceBadge'
import { AccountingCodeBadge } from '@/components/invoices/AccountingCodeBadge'
import { InvoiceActions } from './InvoiceActions'
import { InvoiceAuditPanel } from '@/components/invoices/InvoiceAuditPanel'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { AuditResult } from '@/lib/invoice-audit/types'
import {
  getConnectionForInvoice,
  mapConnectionRow,
  providerDisplayName,
} from '@/lib/accounting-connection'
import { InvoiceExportButtons } from '@/components/invoices/InvoiceExportButtons'
import { InvoiceDeleteButton } from '@/components/invoices/InvoiceDeleteButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) notFound()

  const inv = invoice as ProcessedInvoice
  const problemy = inv.problemy ?? []
  const { data: lastSentLog } = await supabase
    .from('invoice_audit_log')
    .select('details, created_at')
    .eq('invoice_id', id)
    .eq('action', 'sent')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sentProvider =
    lastSentLog?.details &&
    typeof lastSentLog.details === 'object' &&
    'provider' in (lastSentLog.details as Record<string, unknown>)
      ? String((lastSentLog.details as { provider?: string }).provider ?? '')
      : null
  const sentDocumentId =
    lastSentLog?.details &&
    typeof lastSentLog.details === 'object' &&
    'document_id' in (lastSentLog.details as Record<string, unknown>)
      ? String((lastSentLog.details as { document_id?: string }).document_id ?? '')
      : null

  /** Oprava starých záznamů: API odeslání proběhlo, ale status zůstal chybný */
  const effectivelySent = !!lastSentLog && inv.status !== 'rejected'
  const displayStatus = effectivelySent ? 'sent_to_accounting' : inv.status
  const canAct =
    !effectivelySent && INVOICE_ACTIONABLE_STATUSES.includes(inv.status)

  const { data: lastErrorLog } = await supabase
    .from('invoice_audit_log')
    .select('details, created_at')
    .eq('invoice_id', id)
    .eq('action', 'error')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastSendError =
    lastErrorLog?.details &&
    typeof lastErrorLog.details === 'object' &&
    'error' in (lastErrorLog.details as Record<string, unknown>)
      ? String((lastErrorLog.details as { error?: string }).error ?? '')
      : null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const connectionRow = await getConnectionForInvoice(
    supabase,
    user.id,
    user.email ?? '',
    profile?.full_name,
    inv.workspace_id
  )

  const accountingConn = connectionRow
    ? mapConnectionRow(connectionRow as Record<string, unknown>)
    : null

  const formatDate = (d: string | null) =>
    d ? new Intl.DateTimeFormat('cs-CZ').format(new Date(d)) : null
  const formatMoney = (n: number | null) =>
    n != null
      ? new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency: inv.mena ?? 'CZK',
        }).format(n)
      : null

  const auditResult = (inv.audit_result as AuditResult | null) ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/faktury"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zpět na faktury
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {inv.dodavatel_nazev ?? 'Faktura'}
          </h1>
          {inv.cislo_faktury && (
            <p className="text-sm text-gray-500 mt-0.5">Číslo faktury: {inv.cislo_faktury}</p>
          )}
        </div>
        <InvoiceStatusBadge status={displayStatus} />
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                {inv.sender_email && `Od: ${inv.sender_email}`}
                {inv.received_at && (
                  <> · Přijato {formatDate(inv.received_at)}</>
                )}
              </p>
            </div>
            <ConfidenceBadge value={inv.confidence} />
          </div>
        </div>

        {/* Warning about low-confidence fields */}
        {problemy.length > 0 && (
          <div className="mx-6 my-4 flex items-start gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Nízká jistota u polí:</p>
              <p className="text-sm text-yellow-700">{problemy.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Extracted fields */}
        <div className="px-6 py-2">
          <FieldRow
            label="Dodavatel"
            value={inv.dodavatel_nazev}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('dodavatel_nazev')}
          />
          <FieldRow
            label="IČO"
            value={inv.dodavatel_ico}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('dodavatel_ico')}
          />
          <FieldRow
            label="DIČ"
            value={inv.dodavatel_dic}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('dodavatel_dic')}
          />
          <FieldRow
            label="Číslo faktury"
            value={inv.cislo_faktury}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('cislo_faktury')}
          />
          <FieldRow
            label="Datum vystavení"
            value={formatDate(inv.datum_vystaveni)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('datum_vystaveni')}
          />
          <FieldRow
            label="Datum splatnosti"
            value={formatDate(inv.datum_splatnosti)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('datum_splatnosti')}
          />
          <FieldRow
            label="Variabilní symbol"
            value={inv.variabilni_symbol}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('variabilni_symbol')}
          />
          <FieldRow
            label="Základ DPH"
            value={formatMoney(inv.castka_bez_dph)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('castka_bez_dph')}
          />
          <FieldRow
            label={`DPH ${inv.sazba_dph ?? 0}%`}
            value={formatMoney(inv.castka_dph)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('castka_dph')}
          />
          <FieldRow
            label="CELKEM"
            value={formatMoney(inv.castka_celkem)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('castka_celkem')}
          />
          {inv.iban && (
            <FieldRow
              label="IBAN"
              value={inv.iban}
              globalConfidence={inv.confidence}
              inProblemy={problemy.includes('iban')}
            />
          )}
          {inv.popis_plneni && (
            <FieldRow
              label="Popis plnění"
              value={inv.popis_plneni}
              globalConfidence={inv.confidence}
              inProblemy={problemy.includes('popis_plneni')}
            />
          )}
        </div>

        {/* Accounting code section */}
        {inv.ucetni_kod && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Navržený účetní kód
            </p>
            <AccountingCodeBadge
              kod={inv.ucetni_kod}
              nazev={inv.ucetni_kod_nazev ?? ''}
              duvod={inv.ucetni_kod_duvod ?? ''}
              confidence={inv.ucetni_kod_confidence ?? 0}
            />
          </div>
        )}
      </div>

      <InvoiceAuditPanel audit={auditResult} />

      <InvoiceExportButtons invoiceId={inv.id} />

      {/* Actions */}
      {canAct && accountingConn && (
        <>
          {lastSendError && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-sm text-red-800">
              <p className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Poslední pokus o odeslání selhal
              </p>
              <p className="mt-1 text-red-700">{lastSendError}</p>
              <p className="mt-2 text-xs text-red-600">
                Opravte příčinu (např. nastavení ve {providerDisplayName(accountingConn.provider)})
                a zkuste odeslat znovu, nebo stáhněte export pro Pohodu / Money / Helios.
              </p>
            </div>
          )}
          <InvoiceActions
            invoiceId={inv.id}
            invoice={inv}
            accountingProvider={accountingConn.provider}
            auditHasCritical={auditResult?.hasCritical ?? false}
            supplierName={inv.dodavatel_nazev}
          />
        </>
      )}

      {!canAct && displayStatus === 'sent_to_accounting' && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center space-y-3">
          <p className="text-sm text-gray-600">
            ✅ Faktura byla odeslána do{' '}
            <strong>
              {providerDisplayName(inv.accounting_provider ?? sentProvider ?? '')}
            </strong>
            {(inv.accounting_document_id ?? sentDocumentId) && (
              <> · Doklad č. {inv.accounting_document_id ?? sentDocumentId}</>
            )}
          </p>
          <InvoiceDeleteButton
            invoiceId={inv.id}
            supplierName={inv.dodavatel_nazev}
            redirectTo="/faktury"
            variant="ghost"
            className="text-gray-500"
          />
        </div>
      )}

      {canAct && !accountingConn && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <p className="text-sm text-gray-600">
            Pro odeslání přes API připojte iDoklad, Fakturoid nebo SuperFakturu v{' '}
            <Link href="/settings/accounting" className="underline font-medium text-blue-600">
              nastavení fakturačního systému
            </Link>
            . Pro Pohodu, Money S3 nebo Helios použijte export souborů výše.
          </p>
          <InvoiceDeleteButton
            invoiceId={inv.id}
            supplierName={inv.dodavatel_nazev}
            redirectTo="/faktury"
          />
        </div>
      )}
    </div>
  )
}
