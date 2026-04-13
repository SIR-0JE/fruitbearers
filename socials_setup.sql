-- Create the church_socials table
create table if not exists public.church_socials (
    id uuid default gen_random_uuid() primary key,
    platform text not null unique, -- e.g. 'YouTube', 'Instagram', etc.
    url text not null,
    is_active boolean default true,
    order_number integer default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.church_socials enable row level security;

-- Policies
create policy "Allow public read-only access to active socials"
on public.church_socials for select
using (is_active = true);

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

-- Function to handle updated_at
create or replace function public.handle_socials_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to handle updated_at
create trigger on_socials_updated
    before update on public.church_socials
    for each row
    execute function public.handle_socials_updated_at();

-- Insert initial supported platforms (inactive placeholders)
insert into public.church_socials (platform, url, is_active, order_number)
values 
    ('YouTube', '', false, 1),
    ('Instagram', '', false, 2),
    ('Facebook', '', false, 3),
    ('TikTok', '', false, 4),
    ('Twitter', '', false, 5),
    ('WhatsApp', '', false, 6),
    ('Telegram', '', false, 7),
    ('Website', '', false, 8)
on conflict (platform) do nothing;
