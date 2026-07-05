-- Kredit faktur (balíček Standard: +100 jednorázově, bez měsíčního resetu)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS invoice_credits integer NOT NULL DEFAULT 0;
