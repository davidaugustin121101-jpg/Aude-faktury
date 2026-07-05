-- Sloupce chybějící oproti aplikaci (prod schema drift)
ALTER TABLE public.processed_invoices
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS raw_extraction jsonb,
  ADD COLUMN IF NOT EXISTS accounting_connection_id uuid REFERENCES public.accounting_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Sjednocení status constraint s aplikací
ALTER TABLE public.processed_invoices
  DROP CONSTRAINT IF EXISTS processed_invoices_status_check;

ALTER TABLE public.processed_invoices
  ADD CONSTRAINT processed_invoices_status_check
  CHECK (status IN (
    'pending_review',
    'approved',
    'rejected',
    'sent',
    'sent_to_accounting',
    'error',
    'needs_manual_check'
  ));
