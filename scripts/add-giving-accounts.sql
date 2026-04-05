-- Add giving_accounts table for dynamic bank details
CREATE TABLE IF NOT EXISTS public.giving_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL, -- Offering, Tithe, etc.
  bank_name   TEXT NOT NULL,
  account_no  TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some default accounts
INSERT INTO public.giving_accounts (category, bank_name, account_no, account_name)
VALUES 
('Offering', 'GTBank', '0123456789', 'Fruitbearers Church - Offering'),
('Tithe', 'GTBank', '9876543210', 'Fruitbearers Church - Tithe'),
('Building', 'Zenith Bank', '5554443332', 'Fruitbearers Church - Building Fund');

-- Enable RLS
ALTER TABLE public.giving_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read-only access to giving accounts"
  ON public.giving_accounts FOR SELECT USING (true);

CREATE POLICY "Admins can manage giving accounts"
  ON public.giving_accounts FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
