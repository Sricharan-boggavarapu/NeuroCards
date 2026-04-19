-- NeuroCards schema — run in Supabase SQL Editor or via CLI
-- Enables RLS and ties data to auth.users

create extension if not exists "pgcrypto";

-- Profiles (gamification + display)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  streak integer not null default 0,
  xp integer not null default 0,
  last_study_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_filename text,
  summary text,
  quiz jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  question text not null,
  answer text not null,
  card_type text not null default 'definition',
  difficulty_label text,
  next_review timestamptz not null default now(),
  repetition_count integer not null default 0,
  interval_days integer not null default 1,
  mastery_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists cards_deck_next_idx on public.cards (deck_id, next_review);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  rating text not null check (rating in ('easy', 'medium', 'hard')),
  reviewed_at timestamptz not null default now()
);

create index if not exists progress_user_idx on public.progress (user_id, reviewed_at desc);

-- New user → profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->> 'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.progress enable row level security;

-- Profiles
drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Decks
drop policy if exists "Users CRUD own decks" on public.decks;
create policy "Users CRUD own decks" on public.decks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cards (via deck ownership)
drop policy if exists "Users manage cards in own decks" on public.cards;
create policy "Users manage cards in own decks" on public.cards
  for all using (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.user_id = auth.uid())
  );

-- Progress
drop policy if exists "Users manage own progress" on public.progress;
create policy "Users manage own progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
