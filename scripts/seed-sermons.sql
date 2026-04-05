-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/ldkgcoykwomwkdlkepti/sql)
-- This creates the sermons table (if not exists) and inserts the 3 Fruitbearers sermon records.

-- 1. Create table (safe - won't overwrite if already exists)
CREATE TABLE IF NOT EXISTS public.sermons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  series        TEXT,
  speaker       TEXT,
  audio_url     TEXT,
  thumbnail_url TEXT,
  description   TEXT,
  duration      TEXT,
  service_type  TEXT,
  date          DATE DEFAULT CURRENT_DATE,
  views         INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Allow public read access (anon key can read sermons)
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sermons_public_read" ON public.sermons;
CREATE POLICY "sermons_public_read"
  ON public.sermons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "sermons_admin_write" ON public.sermons;
CREATE POLICY "sermons_admin_write"
  ON public.sermons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Insert 3 Fruitbearers sermon records with the provided flier images as thumbnails
INSERT INTO public.sermons (title, series, speaker, date, duration, thumbnail_url, audio_url, service_type, views)
VALUES
  (
    'Discovering Your Purpose — Part 3',
    'Pathlighters Academy',
    'Fruit Bearers, Bowen University',
    '2026-04-04',
    '53:00',
    '/sermons/discovering-your-purpose.jpg',
    '',
    'Special Service',
    0
  ),
  (
    'Join Us This Sunday',
    'Sunday Service',
    'Fruit Bearers, Bowen University',
    '2026-02-28',
    '48:00',
    '/sermons/join-us-sunday.jpg',
    '',
    'Sunday',
    0
  ),
  (
    'Overcoming Your Background',
    'Pathlighters Academy',
    'Fruit Bearers, Bowen University',
    '2026-03-15',
    '61:00',
    '/sermons/overcoming-your-background.jpg',
    '',
    'Special Service',
    0
  )
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT id, title, series, date, thumbnail_url FROM public.sermons ORDER BY date DESC;
