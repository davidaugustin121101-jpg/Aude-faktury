-- PDF přílohy faktur (pro odeslání do iDoklad / SuperFaktura)
ALTER TABLE public.processed_invoices
  ADD COLUMN IF NOT EXISTS storage_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-pdfs',
  'invoice-pdfs',
  false,
  10485760,
  ARRAY['application/pdf', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users read own invoice pdfs" ON storage.objects;
CREATE POLICY "Users read own invoice pdfs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoice-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
