-- Inbound email address per user

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS inbound_email_token text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_inbound_email_token
  ON public.user_profiles (inbound_email_token)
  WHERE inbound_email_token IS NOT NULL;

-- Backfill tokens for existing users
UPDATE public.user_profiles
SET inbound_email_token = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
WHERE inbound_email_token IS NULL;

ALTER TABLE public.user_profiles
  ALTER COLUMN inbound_email_token SET DEFAULT lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_country text;
BEGIN
  v_country := COALESCE(new.raw_user_meta_data->>'country', 'cz');
  INSERT INTO public.user_profiles (id, email, plan, country, country_confirmed_at, inbound_email_token)
  VALUES (
    new.id,
    new.email,
    'free',
    'cz',
    CASE WHEN new.raw_user_meta_data->>'country' IS NOT NULL THEN now() ELSE NULL END,
    lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
