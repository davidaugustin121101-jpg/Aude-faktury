-- ============================================
-- AUDEFLOW FAKTURY – kompletní schéma v1.0
-- ============================================

CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  invoices_this_month INTEGER NOT NULL DEFAULT 0,
  billing_cycle_start DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION reset_monthly_invoice_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.billing_cycle_start != OLD.billing_cycle_start THEN
    NEW.invoices_this_month := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE accounting_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('idoklad', 'fakturoid')),
  idoklad_client_id TEXT,
  idoklad_client_secret TEXT,
  fakturoid_oauth_token TEXT,
  fakturoid_account_slug TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_tested_at TIMESTAMPTZ,
  last_test_ok BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE processed_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  dodavatel_nazev TEXT,
  dodavatel_ico TEXT,
  dodavatel_dic TEXT,
  cislo_faktury TEXT,
  datum_vystaveni DATE,
  datum_splatnosti DATE,
  variabilni_symbol TEXT,
  castka_bez_dph DECIMAL(12,2),
  sazba_dph INTEGER CHECK (sazba_dph IN (0, 12, 21)),
  castka_dph DECIMAL(12,2),
  castka_celkem DECIMAL(12,2),
  mena TEXT NOT NULL DEFAULT 'CZK',
  popis_plneni TEXT,
  ucetni_kod TEXT,
  ucetni_kod_nazev TEXT,
  ucetni_kod_duvod TEXT,
  ucetni_kod_confidence DECIMAL(3,2),
  confidence DECIMAL(3,2),
  problemy TEXT[],
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN (
      'pending_review',
      'approved',
      'rejected',
      'sent',
      'error'
    )),
  accounting_provider TEXT,
  accounting_document_id TEXT,
  accounting_document_url TEXT,
  error_message TEXT,
  original_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE invoice_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES processed_invoices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vlastní profil" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Vlastní připojení" ON accounting_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Vlastní faktury" ON processed_invoices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Vlastní logy" ON invoice_audit_log
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_invoice_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET invoices_this_month = invoices_this_month + 1,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX idx_invoices_user_id ON processed_invoices(user_id);
CREATE INDEX idx_invoices_status ON processed_invoices(status);
CREATE INDEX idx_invoices_created ON processed_invoices(created_at DESC);
CREATE INDEX idx_audit_invoice_id ON invoice_audit_log(invoice_id);
