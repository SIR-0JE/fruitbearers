-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/ldkgcoykwomwkdlkepti/sql/new
-- ============================================================

-- 1. Add attendance_streak to profiles (check-in fire counter)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS attendance_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkin DATE;

-- 2. App Settings table for admin-controlled content
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default featured flier (admin can update via dashboard)
INSERT INTO public.app_settings (key, value)
VALUES ('featured_flier_url', '/sermons/discovering-your-purpose.jpg')
ON CONFLICT (key) DO NOTHING;

-- Allow anyone to read settings, only admins to write
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_public_read" ON public.app_settings;
CREATE POLICY "settings_public_read" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "settings_admin_write" ON public.app_settings;
CREATE POLICY "settings_admin_write" ON public.app_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Attendance table (main check-in record)
CREATE TABLE IF NOT EXISTS public.attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  method       TEXT DEFAULT 'qr', -- 'qr' | 'manual'
  UNIQUE(user_id, session_date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_self_read" ON public.attendance;
CREATE POLICY "attendance_self_read" ON public.attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "attendance_self_insert" ON public.attendance;
CREATE POLICY "attendance_self_insert" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Missed attendance notifications (admin-generated)
CREATE TABLE IF NOT EXISTS public.missed_attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  email_sent  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.missed_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "missed_admin_all" ON public.missed_attendance;
CREATE POLICY "missed_admin_all" ON public.missed_attendance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Verify
SELECT key, value FROM public.app_settings;
