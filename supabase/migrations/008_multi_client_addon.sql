-- Modul více klientů = samostatné Stripe předplatné (doplňek k tarifu Standard/Pro)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_addon_subscription_id text;
