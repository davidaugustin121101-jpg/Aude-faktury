-- Fix signup 500: user_profiles.email is NOT NULL but handle_new_user omitted it

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
  INSERT INTO public.user_profiles (id, email, plan, country, country_confirmed_at)
  VALUES (
    new.id,
    new.email,
    'free',
    v_country,
    CASE WHEN new.raw_user_meta_data->>'country' IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
