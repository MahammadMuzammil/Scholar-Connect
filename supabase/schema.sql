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
do $$
begin
  alter publication supabase_realtime add table bookings;
exception when duplicate_object then
  null;  -- already a member of the publication
end $$;

-- ──────────────── Scholars (public profiles) ────────────────
-- Add, edit, disable scholars entirely from the Supabase Table Editor.
create table if not exists scholars (
  id                  text primary key,
  name                text not null,
  title               text,
  specialties         text[] not null default '{}',
  languages           text[] not null default '{}',
  rating              numeric(2,1) default 4.8,
  reviews             int default 0,
  price_per_session   int not null default 40,
  session_minutes     int not null default 30,
  photo               text,
  bio                 text,
  verified            boolean not null default true,
  active              boolean not null default true,   -- set to false to hide from marketplace
  sort_order          int default 0,
  created_at          timestamptz not null default now()
);

alter table scholars enable row level security;

drop policy if exists "scholars: public read active" on scholars;
create policy "scholars: public read active"
  on scholars for select
  to anon, authenticated
  using (active = true);

-- Allow any signed-in user to create their own scholar profile row.
-- (Demo-level security: anyone could self-promote — acceptable for MVP.)
drop policy if exists "scholars: authenticated insert" on scholars;
create policy "scholars: authenticated insert"
  on scholars for insert
  to authenticated
  with check (true);

-- Seed current scholars. On conflict (re-run), update public fields.
insert into scholars (id, name, title, specialties, languages, rating, reviews, price_per_session, session_minutes, photo, bio, sort_order)
values
  ('sh-muzammil',
   'Sheikh Muzammil',
   'Mufti & Islamic Jurisprudence Scholar',
   array['Fiqh', 'Family Matters', 'Ramadan Rulings'],
   array['Urdu', 'Arabic', 'English'],
   4.9, 1420, 40, 30,
   'https://i.pravatar.cc/300?img=12',
   'Specializes in contemporary fiqh issues, family rulings, and guidance during Ramadan. Trained in the classical Hanafi tradition with 15+ years of teaching.',
   10),
  ('sh-farooq',
   'Sheikh Farooq',
   'Aqeedah & Seerah Scholar',
   array['Aqeedah', 'Seerah', 'Dream Interpretation'],
   array['Arabic', 'English', 'Urdu'],
   4.8, 980, 50, 30,
   'https://i.pravatar.cc/300?img=33',
   'Teaches aqeedah and Prophetic biography at an international Islamic institute. Also provides Shariah-grounded dream interpretation in the tradition of Imam Ibn Sirin.',
   20)
on conflict (id) do update set
  name              = excluded.name,
  title             = excluded.title,
  specialties       = excluded.specialties,
  languages         = excluded.languages,
  rating            = excluded.rating,
  reviews           = excluded.reviews,
  price_per_session = excluded.price_per_session,
  session_minutes   = excluded.session_minutes,
  photo             = excluded.photo,
  bio               = excluded.bio,
  sort_order        = excluded.sort_order;

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

-- Allow users to update their own profile (e.g. set role=scholar on signup).
drop policy if exists "profiles: self update" on profiles;
create policy "profiles: self update"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

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
