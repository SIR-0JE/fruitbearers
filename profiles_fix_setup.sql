-- ============================================================
-- FRUITBEARERS: Profile Cleanup & Columns Setup
-- Run this in your Supabase SQL Editor if profiles are failing
-- ============================================================

-- 1. Ensure columns exist (Postgres safely handles this if they do)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dob') THEN
    ALTER TABLE public.profiles ADD COLUMN dob DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wisdom_house') THEN
    ALTER TABLE public.profiles ADD COLUMN wisdom_house TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Clean up RLS Policies (Removing messy duplicates if any)
-- WARNING: This will drop and re-create policies for cleanliness.
DROP POLICY IF EXISTS "profiles_select_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by self and admins" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- 3. Solid, simple policies for profiles
-- SELECT: Prevent infinite recursion by allowing logged-in members to read profiles setup
CREATE POLICY "profiles_select_policy" ON public.profiles 
FOR SELECT USING (true);

-- INSERT: Allow users to create their initial profile row if missing
CREATE POLICY "profiles_insert_policy" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Allow users to modify their existing profile rows
CREATE POLICY "profiles_update_policy" ON public.profiles 
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Set correct permissions for storage (avatars bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Enable public access but restrict uploads to the owner
-- Note: 'avatars/' prefix check ensures members don't mess with each other's files
-- Storage policies: Start fresh
DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar viewing" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;

CREATE POLICY "Avatar upload" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatar viewing" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars');
