-- PDF faktury pro odeslání do Fakturoid Krabice / přílohy výdaje
ALTER TABLE processed_invoices
  ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoice-pdfs', 'invoice-pdfs', false, 10485760, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own invoice pdfs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own invoice pdfs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
