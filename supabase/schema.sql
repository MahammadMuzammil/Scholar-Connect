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
