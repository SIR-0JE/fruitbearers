-- ============================================================
-- FRUITBEARERS: Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create media_gallery table (for church photos uploaded by admin)
CREATE TABLE IF NOT EXISTS media_gallery (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  image_url  TEXT NOT NULL,
  date       DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE media_gallery ENABLE ROW LEVEL SECURITY;

-- 3. Members can read all photos
CREATE POLICY "Anyone can view gallery"
  ON media_gallery FOR SELECT USING (true);

-- 4. Only admins can insert/delete
CREATE POLICY "Admins can manage gallery"
  ON media_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND lower(role) = 'admin'
    )
  );

-- ============================================================
-- STORAGE: Run these in Supabase → Storage → New Bucket
-- OR use the SQL below to create them programmatically
-- ============================================================

-- Create a single 'media' bucket for all uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to 'media' bucket
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Allow anyone to view/download media (public bucket)  
CREATE POLICY "Anyone can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Allow admins to delete media
CREATE POLICY "Admins can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');
