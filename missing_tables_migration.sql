-- ============================================================
-- FRUITBEARERS – MISSING TABLES MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. CHURCH SOCIALS
-- (Used by Socials tab in admin + "Join Online" popup for members)
create table if not exists public.church_socials (
    id uuid default gen_random_uuid() primary key,
    platform text not null unique,       -- 'YouTube', 'Instagram', etc.
    url text not null default '',
    is_active boolean default false,
    order_number integer default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.church_socials enable row level security;

-- Everyone can read active socials (member app needs this)
create policy "Allow public read-only access to active socials"
on public.church_socials for select
using (true);   -- allow all reads so members can see inactive ones via admin check too

-- Admins can do full CRUD
create policy "Allow admins full access to socials"
on public.church_socials for all
using (
    exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'admin'
    )
);

-- Index for ordering
create index if not exists church_socials_order_idx on public.church_socials(order_number);

-- Seed all 8 platforms as inactive placeholders so upsert works immediately
insert into public.church_socials (platform, url, is_active, order_number)
values
    ('YouTube',   '', false, 1),
    ('Instagram', '', false, 2),
    ('Facebook',  '', false, 3),
    ('WhatsApp',  '', false, 4),
    ('TikTok',    '', false, 5),
    ('Twitter',   '', false, 6),
    ('Telegram',  '', false, 7),
    ('Website',   '', false, 8)
on conflict (platform) do nothing;


-- 2. GIVING ACCOUNTS
-- (Used by Finance tab in admin + Giving screen for members)
create table if not exists public.giving_accounts (
    id uuid default gen_random_uuid() primary key,
    account_name text not null,
    account_no text not null,
    bank_name text not null,
    category text not null default 'Offering',
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.giving_accounts enable row level security;

-- Everyone can read accounts (members need to see bank details)
create policy "Allow public read-only access to giving accounts"
on public.giving_accounts for select
using (true);

-- Admins can manage accounts
create policy "Allow admins full access to giving accounts"
on public.giving_accounts for all
using (
    exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'admin'
    )
);


-- 3. APP SETTINGS
-- (Used by flier URL, prayer link, and other key-value settings)
create table if not exists public.app_settings (
    key text primary key,
    value text not null default '',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.app_settings enable row level security;

-- Everyone can read settings
create policy "Allow public read-only access to app settings"
on public.app_settings for select
using (true);

-- Admins can manage settings
create policy "Allow admins full access to app settings"
on public.app_settings for all
using (
    exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'admin'
    )
);

-- Seed defaults
insert into public.app_settings (key, value)
values
    ('featured_flier_url', ''),
    ('prayer_link', '')
on conflict (key) do nothing;


-- 4. ATTENDANCE SESSIONS topic_id column
-- (If not already added from a previous migration)
alter table public.attendance_sessions
    add column if not exists topic_id uuid references public.topics(id) on delete set null;


-- ============================================================
-- DONE! All missing tables are now created.
-- ============================================================
