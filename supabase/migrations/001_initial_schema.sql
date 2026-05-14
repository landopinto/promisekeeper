-- ============================================================
-- Kept — initial schema
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── promises ──────────────────────────────────────────────────
create table public.promises (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null check (type in ('habit', 'pledge')),
  text          text not null,
  emoji         text,
  status        text not null default 'active' check (status in ('active', 'archived')),
  deadline      date,            -- pledges only
  reminder_time time,            -- habits only (v2 push notifications)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── habit_entries ─────────────────────────────────────────────
create table public.habit_entries (
  id          uuid primary key default gen_random_uuid(),
  promise_id  uuid not null references public.promises(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  kept        boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (promise_id, date)
);

-- ── streaks ───────────────────────────────────────────────────
create table public.streaks (
  id                  uuid primary key default gen_random_uuid(),
  promise_id          uuid not null unique references public.promises(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  current_streak      int not null default 0,
  longest_streak      int not null default 0,
  last_kept_date      date,
  grace_days_used     int not null default 0,
  grace_window_start  date,
  updated_at          timestamptz not null default now()
);

-- ── badges (static seed data) ─────────────────────────────────
create table public.badges (
  id               text primary key,
  name             text not null,
  description      text not null,
  condition_type   text not null,
  condition_value  int
);

-- ── user_badges ───────────────────────────────────────────────
create table public.user_badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  badge_id   text not null references public.badges(id),
  earned_at  timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ── events (audit log) ────────────────────────────────────────
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_type  text not null,
  promise_id  uuid references public.promises(id) on delete set null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

-- ── indexes ───────────────────────────────────────────────────
create index idx_promises_user_id        on public.promises(user_id);
create index idx_habit_entries_user_date on public.habit_entries(user_id, date);
create index idx_habit_entries_promise   on public.habit_entries(promise_id);
create index idx_streaks_user_id         on public.streaks(user_id);
create index idx_events_user_id          on public.events(user_id, created_at desc);
create index idx_user_badges_user_id     on public.user_badges(user_id);

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles     enable row level security;
alter table public.promises      enable row level security;
alter table public.habit_entries enable row level security;
alter table public.streaks       enable row level security;
alter table public.user_badges   enable row level security;
alter table public.events        enable row level security;
alter table public.badges        enable row level security;

-- profiles
create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id);

-- promises
create policy "Users manage own promises"
  on public.promises for all
  using (auth.uid() = user_id);

-- habit_entries
create policy "Users manage own habit entries"
  on public.habit_entries for all
  using (auth.uid() = user_id);

-- streaks
create policy "Users manage own streaks"
  on public.streaks for all
  using (auth.uid() = user_id);

-- user_badges
create policy "Users manage own badges"
  on public.user_badges for all
  using (auth.uid() = user_id);

-- events
create policy "Users manage own events"
  on public.events for all
  using (auth.uid() = user_id);

-- badges — public read, no client writes
create policy "Badges are publicly readable"
  on public.badges for select
  using (true);
