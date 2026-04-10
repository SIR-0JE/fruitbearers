-- =====================================================================================
-- THEME / MODULE / TOPIC ARCHITECTURE (REV 2 - Global Coaches)
-- =====================================================================================

-- 0. GLOBAL COACHES
create table public.coaches (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  avatar_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. THEMES (Top Level Academy / Course)
create table public.themes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MODULES (Second Level group)
create table public.modules (
  id uuid default gen_random_uuid() primary key,
  theme_id uuid references public.themes(id) on delete cascade not null,
  title text not null,
  order_number int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TOPICS (Third Level actual learning nodes)
create table public.topics (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules(id) on delete cascade not null,
  title text not null,
  order_number int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TOPIC ATTENDANCE (Mapping a User to a Topic + exactly who taught it!)
create table public.topic_attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.topics(id) on delete cascade not null,
  coach_id uuid references public.coaches(id) on delete set null, -- Who taught it?
  attendance_id uuid references public.attendance_records(id) on delete cascade not null, 
  session_id uuid references public.attendance_sessions(id) on delete cascade not null,
  attended_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, topic_id) -- A user can only complete a topic once!
);

-- =====================================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================================

alter table public.coaches enable row level security;
alter table public.themes enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.topic_attendance enable row level security;

-- EVERYONE can read the curriculum and coaches
create policy "Anyone can read coaches" on public.coaches for select using (true);
create policy "Anyone can read themes" on public.themes for select using (true);
create policy "Anyone can read modules" on public.modules for select using (true);
create policy "Anyone can read topics" on public.topics for select using (true);

-- USERS can read their own topic attendance and insert into it
create policy "Users can view their own topic attendance" on public.topic_attendance
  for select using (auth.uid() = user_id);

create policy "Users can submit their topic attendance" on public.topic_attendance
  for insert with check (auth.uid() = user_id);

-- ADMINS can full CRUD everything
create policy "Admins full manage coaches" on public.coaches
  for all using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins full manage themes" on public.themes
  for all using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins full manage modules" on public.modules
  for all using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins full manage topics" on public.topics
  for all using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins full view all topic attendance" on public.topic_attendance
  for select using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
