-- Hash PDF pro deduplikaci před voláním LLM (stejný soubor = žádné API)

ALTER TABLE public.processed_invoices
  ADD COLUMN IF NOT EXISTS pdf_sha256 text;

CREATE INDEX IF NOT EXISTS idx_processed_invoices_user_pdf_hash
  ON public.processed_invoices(user_id, pdf_sha256)
  WHERE pdf_sha256 IS NOT NULL;
