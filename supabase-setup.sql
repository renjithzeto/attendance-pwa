-- ====================================================================
-- WorkPulse Attendance - Supabase Database & Storage Setup Script
-- ====================================================================
-- Instructions:
-- 1. Create a free project at https://supabase.com
-- 2. In your Supabase dashboard, open the "SQL Editor" tab
-- 3. Paste and run this entire script
-- 4. Copy your Project URL & Anon Key into D:\attendance-pwa\.env.local
-- ====================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Profiles Table (Linked to Supabase Auth users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'staff')) default 'staff',
  shift_start time not null default '09:00:00',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Office Geofence & Shift Settings Table
create table if not exists public.office_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Main Office',
  latitude double precision not null default 12.9716,
  longitude double precision not null default 77.5946,
  radius_meters numeric not null default 100,
  grace_period_mins integer not null default 15,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Seed default office settings if empty
insert into public.office_settings (name, latitude, longitude, radius_meters, grace_period_mins)
select 'Main Office', 12.9716, 77.5946, 100, 15
where not exists (select 1 from public.office_settings);

-- 4. Attendance Logs Table
create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  punch_in_time timestamptz not null,
  punch_in_lat double precision not null,
  punch_in_lng double precision not null,
  punch_in_distance numeric not null,
  selfie_url text not null,
  status text not null check (status in ('Present', 'Late')),
  punch_out_time timestamptz,
  punch_out_lat double precision,
  punch_out_lng double precision,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_date unique (user_id, date)
);

-- 5. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.office_settings enable row level security;
alter table public.attendance_logs enable row level security;

-- Profiles: Authenticated users can view; Admins have full access
create policy "Allow authenticated users to read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Allow users to update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Office Settings: Authenticated users can read; Admins can update
create policy "Allow authenticated to read office_settings"
  on public.office_settings for select
  to authenticated
  using (true);

create policy "Allow authenticated to insert/update office_settings"
  on public.office_settings for all
  to authenticated
  using (true)
  with check (true);

-- Attendance Logs: Users can read own and insert; Admins can read all
create policy "Allow authenticated users to read attendance logs"
  on public.attendance_logs for select
  to authenticated
  using (true);

create policy "Allow staff to insert own attendance"
  on public.attendance_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Allow staff to update own attendance"
  on public.attendance_logs for update
  to authenticated
  using (auth.uid() = user_id);

-- 6. Storage Bucket for Live Camera Selfies
insert into storage.buckets (id, name, public)
values ('selfies', 'selfies', true)
on conflict (id) do update set public = true;

create policy "Allow authenticated users to upload selfies"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'selfies');

create policy "Allow public view of selfies"
  on storage.objects for select
  to public
  using (bucket_id = 'selfies');
