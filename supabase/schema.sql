-- ScholarConnect — Supabase schema
-- Paste this whole file into the Supabase SQL editor and click "Run".
-- Re-running is safe (uses IF NOT EXISTS / ON CONFLICT).

-- ──────────────── Bookings table ────────────────

create table if not exists bookings (
  id             text primary key,
  user_id        text not null,
  user_name      text not null,
  user_email     text not null,
  scholar_id     text not null,
  scholar_name   text not null,
  slot_id        text not null,
  slot_starts_at timestamptz not null,
  duration_minutes int not null default 30,
  amount         int not null,
  base_price     int not null,
  post_fajr      boolean not null default false,
  premium_percent int not null default 0,
  topic          text,
  room_id        text not null,
  status         text not null default 'confirmed',
  read           boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (scholar_id, slot_id)  -- one booking per slot per scholar
);

create index if not exists bookings_user_idx    on bookings (user_id, created_at desc);
create index if not exists bookings_scholar_idx on bookings (scholar_id, created_at desc);

-- Enable Row-Level Security but allow anon access (demo mode).
-- For production, move auth to Supabase Auth and tighten these policies.
alter table bookings enable row level security;

drop policy if exists "anon can read bookings" on bookings;
create policy "anon can read bookings"
  on bookings for select
  to anon, authenticated
  using (true);

drop policy if exists "anon can insert bookings" on bookings;
create policy "anon can insert bookings"
  on bookings for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon can update bookings" on bookings;
create policy "anon can update bookings"
  on bookings for update
  to anon, authenticated
  using (true) with check (true);

-- ──────────────── Realtime ────────────────
-- Enables realtime subscriptions so the scholar dashboard updates live.
alter publication supabase_realtime add table bookings;

-- ──────────────── Profiles (roles) ────────────────
-- Each Supabase Auth user gets a profile row. The `role` column is the
-- authoritative answer to "is this person a scholar?".
-- Admin changes role via Supabase Table Editor — no code change needed.
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        text not null default 'user' check (role in ('user', 'scholar', 'admin')),
  scholar_id  text,       -- 'sh-muzammil' / 'sh-farooq' when role='scholar', else null
  name        text,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles: self read" on profiles;
create policy "profiles: self read"
  on profiles for select
  to authenticated
  using (id = auth.uid());

-- Auto-create a default 'user' profile row whenever someone signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profile rows for any users who signed up before this table existed.
insert into profiles (id, name)
select u.id, u.raw_user_meta_data->>'name'
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
on conflict (id) do nothing;

-- One-time convenience: if the test scholar accounts exist from earlier setup,
-- promote them. Running this when the users don't exist is a no-op.
update profiles
set role = 'scholar', scholar_id = 'sh-muzammil'
where id in (select id from auth.users where email = 'muzammil@scholarconnect.test');

update profiles
set role = 'scholar', scholar_id = 'sh-farooq'
where id in (select id from auth.users where email = 'farooq@scholarconnect.test');
