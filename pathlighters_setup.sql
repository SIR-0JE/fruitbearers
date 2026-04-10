-- ════════════════════════════════════════════════════════════
-- PATHLIGHTERS ACADEMY SETUP SCHEMA
-- ════════════════════════════════════════════════════════════

-- 1. Create Academies Table (Top Level)
CREATE TABLE IF NOT EXISTS academies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Modules Table
CREATE TABLE IF NOT EXISTS modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id uuid REFERENCES academies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_number integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  coach_name text,
  coach_avatar_url text,
  order_number integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create Lesson Attendance Table (Pivot/Tracking)
CREATE TABLE IF NOT EXISTS lesson_attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  attendance_id uuid REFERENCES attendance_records(id) ON DELETE CASCADE,
  session_id uuid REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  attended_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, lesson_id) -- Prevents a user from registering attendance for the same exact lesson twice
);

-- Enable RLS
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attendance ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════

-- Academies Policies
CREATE POLICY "Admins have full access to academies" ON academies FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
CREATE POLICY "Anyone can view active academies" ON academies FOR SELECT USING (is_active = true);

-- Modules Policies
CREATE POLICY "Admins have full access to modules" ON modules FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
CREATE POLICY "Anyone can view modules" ON modules FOR SELECT USING (true);

-- Lessons Policies
CREATE POLICY "Admins have full access to lessons" ON lessons FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);

-- Lesson Attendance Policies
CREATE POLICY "Admins have full access to lesson_attendance" ON lesson_attendance FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

CREATE POLICY "Users can insert their own lesson attendance" ON lesson_attendance FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can view their own lesson attendance" ON lesson_attendance FOR SELECT USING (
  auth.uid() = user_id
);

-- ════════════════════════════════════
-- INITIAL SEED DATA
-- ════════════════════════════════════
INSERT INTO academies (name, description) VALUES ('Pathlighters Academy', 'Your learning journey to becoming a fully equipped disciple and spiritual leader in the Fruitbearers family.');
