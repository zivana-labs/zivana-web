-- Zivana Web — reconstructed schema
-- Run in Supabase SQL Editor (Dashboard -> SQL -> New query -> Run).
-- Idempotent-ish: uses IF NOT EXISTS where possible. Safe to re-run.
-- Order matters: contributors + core_team first (referenced by others).

-- ---------------------------------------------------------------------------
-- 1. contributors
-- ---------------------------------------------------------------------------
create table if not exists public.contributors (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references auth.users (id) on delete set null,
  name                        text not null,
  email                       text not null unique,
  contributor_type            text not null default 'individual',
  team_name                   text,
  location                    text,
  timezone                    text,
  categories                  text[] not null default '{}',
  skills                      text[],
  availability_hours_per_week integer,
  bio                         text,
  github_handle               text,
  twitter_handle              text,
  linkedin_url                text,
  portfolio_url               text,
  wallet_address              text,
  notification_email          boolean not null default true,
  notification_telegram       boolean not null default false,
  telegram_chat_id            text,
  status                      text not null default 'pending',
  revision_notes              text,
  rejection_reason            text,
  total_points                numeric not null default 0,
  verified_contributions      integer not null default 0,
  max_claims                  integer not null default 3,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. core_team
-- ---------------------------------------------------------------------------
create table if not exists public.core_team (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  email       text not null unique,
  name        text not null,
  role        text,
  department  text,
  permissions text[] not null default '{}',
  is_active   boolean not null default true,
  joined_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. tasks  (FK assigned_to -> contributors; default name = tasks_assigned_to_fkey)
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  description            text,
  category               text,
  complexity             text,
  point_range_min        integer,
  point_range_max        integer,
  deadline_days          integer,
  status                 text not null default 'open',
  primitives             text[],
  links                  jsonb,
  assigned_to            uuid references public.contributors (id) on delete set null,
  claimed_at             timestamptz,
  deadline_at            timestamptz,
  extension_requested_at timestamptz,
  extension_granted      boolean not null default false,
  extended_deadline_at   timestamptz,
  unclaimed_by           text[],
  unclaimed_at           text[],
  created_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. contributions
-- ---------------------------------------------------------------------------
create table if not exists public.contributions (
  id                uuid primary key default gen_random_uuid(),
  contributor_id    uuid references public.contributors (id) on delete cascade,
  task_id           uuid references public.tasks (id) on delete set null,
  title             text not null,
  description       text,
  category          text,
  complexity        text,
  base_points       numeric not null default 0,
  final_points      numeric,
  timing_multiplier numeric not null default 1,
  deadline_at       timestamptz,
  evidence_url      text,
  notes             text,
  status            text not null default 'submitted',
  submission_count  integer not null default 1,
  review_decision   text,
  review_score      numeric,
  review_feedback   jsonb,
  verified_at       timestamptz,
  verified_by       uuid references public.core_team (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. admin_audit_log
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.core_team (id) on delete set null,
  actor_name   text,
  action       text,
  target_type  text,
  target_id    text,
  target_label text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

-- ===========================================================================
-- Row Level Security
-- Service-role key bypasses RLS (used in API routes). Policies below cover the
-- browser (anon + authenticated) clients used by the app pages.
-- ===========================================================================

alter table public.contributors     enable row level security;
alter table public.core_team         enable row level security;
alter table public.tasks             enable row level security;
alter table public.contributions     enable row level security;
alter table public.admin_audit_log   enable row level security;

-- contributors: public read (leaderboard/profiles), self insert/update -------
drop policy if exists contributors_read      on public.contributors;
drop policy if exists contributors_insert    on public.contributors;
drop policy if exists contributors_update    on public.contributors;

create policy contributors_read   on public.contributors
  for select using (true);
create policy contributors_insert on public.contributors
  for insert to authenticated
  with check (user_id = auth.uid());
create policy contributors_update on public.contributors
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- tasks: public read, authenticated update (claim / unclaim) -----------------
drop policy if exists tasks_read   on public.tasks;
drop policy if exists tasks_write  on public.tasks;

create policy tasks_read  on public.tasks
  for select using (true);
create policy tasks_write on public.tasks
  for update to authenticated using (true) with check (true);

-- contributions: public read, authenticated write ---------------------------
drop policy if exists contributions_read  on public.contributions;
drop policy if exists contributions_write on public.contributions;

create policy contributions_read  on public.contributions
  for select using (true);
create policy contributions_write on public.contributions
  for all to authenticated using (true) with check (true);

-- core_team: authenticated read (AdminAuthGate). Writes via service role. -----
drop policy if exists core_team_read on public.core_team;
create policy core_team_read on public.core_team
  for select to authenticated using (true);

-- admin_audit_log: authenticated read. Writes via service role. --------------
drop policy if exists audit_read on public.admin_audit_log;
create policy audit_read on public.admin_audit_log
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Helpful indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_contributors_user_id   on public.contributors (user_id);
create index if not exists idx_contributors_status     on public.contributors (status);
create index if not exists idx_contributions_contrib   on public.contributions (contributor_id);
create index if not exists idx_contributions_task       on public.contributions (task_id);
create index if not exists idx_tasks_assigned_to        on public.tasks (assigned_to);
create index if not exists idx_core_team_user_id        on public.core_team (user_id);
create index if not exists idx_audit_actor_name         on public.admin_audit_log (actor_name);
