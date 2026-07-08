-- Email inbound metadata on processed_invoices (prod schema drift)

ALTER TABLE public.processed_invoices
  ADD COLUMN IF NOT EXISTS original_email_id text,
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS received_at timestamptz;
