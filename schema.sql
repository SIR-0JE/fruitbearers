-- ============================================================
-- FRUITBEARERS – COMPREHENSIVE CHURCH SCHEMA (CCI-Inspired)
-- ============================================================

-- 1. PROFILES / USERS
-- Links to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  avatar_url    TEXT,
  member_code   TEXT UNIQUE DEFAULT LPAD(FLOOR(RANDOM()*10000)::TEXT, 4, '0'),
  campus        TEXT DEFAULT 'Lagos',
  ministry      TEXT,
  cell_group    TEXT,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  dob           DATE,
  wisdom_house  TEXT, -- Legacy field or ministry-specific
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SERMONS (Media)
CREATE TABLE IF NOT EXISTS public.sermons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  series        TEXT,
  speaker       TEXT,
  audio_url     TEXT NOT NULL,
  thumbnail_url TEXT,
  description   TEXT,
  duration      TEXT, -- e.g. "53:00"
  service_type  TEXT, -- Sunday, Midweek, etc.
  date          DATE DEFAULT CURRENT_DATE,
  views         INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EVENTS (Announcements)
CREATE TABLE IF NOT EXISTS public.events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  date          DATE,
  time          TEXT,
  location      TEXT,
  category      TEXT, -- Conference, Special Service, etc.
  flier_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GIVING (Payments)
CREATE TABLE IF NOT EXISTS public.giving (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount            DECIMAL(12,2) NOT NULL,
  category          TEXT NOT NULL CHECK (category IN ('Offering', 'Tithe', 'Rent', 'Missions', 'Building')),
  bank_reference    TEXT,
  paystack_reference TEXT,
  status            TEXT DEFAULT 'pending', -- pending, success, failed
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CONFESSIONS (Declarations)
CREATE TABLE IF NOT EXISTS public.confessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  image_url     TEXT,
  start_date    DATE,
  end_date      DATE,
  views         INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CHECKIN_CODES (Admin-generated codes)
CREATE TABLE IF NOT EXISTS public.checkin_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL, -- 4-digit code
  service_date  DATE DEFAULT CURRENT_DATE,
  service_type  TEXT DEFAULT 'Sunday Service',
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ATTENDANCE (History)
CREATE TABLE IF NOT EXISTS public.attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_code_id UUID REFERENCES public.checkin_codes(id) ON DELETE SET NULL,
  service_date    DATE DEFAULT CURRENT_DATE,
  service_type    TEXT,
  method          TEXT CHECK (method IN ('code', 'qr')),
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, service_date, service_type)
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giving         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance     ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
CREATE POLICY "Public profiles are viewable by self and admins"
  ON public.profiles FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profiles"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. SERMONS, EVENTS, CONFESSIONS (Read-only for public, Write for admins)
CREATE POLICY "Allow public read-only access to media and events"
  ON public.sermons FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to events"
  ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to confessions"
  ON public.confessions FOR SELECT USING (true);

CREATE POLICY "Admins can manage media"
  ON public.sermons FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage confessions"
  ON public.confessions FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 3. GIVING
CREATE POLICY "Users can see their own giving history"
  ON public.giving FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage giving"
  ON public.giving FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 4. CHECKIN_CODES
CREATE POLICY "Authenticated users can see active codes"
  ON public.checkin_codes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage checkin codes"
  ON public.checkin_codes FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 5. ATTENDANCE
CREATE POLICY "Users can see their own attendance"
  ON public.attendance FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Authenticated users can check in"
  ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sermons;
