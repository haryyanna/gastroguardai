create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  mood int not null check (mood between 1 and 5),
  sadness int not null default 0 check (sadness between 0 and 10),
  anxiety int not null default 0 check (anxiety between 0 and 10),
  stress int not null default 0 check (stress between 0 and 10),
  journal text,
  created_at timestamptz not null default now(),
  checkin_day date generated always as ((timezone('Asia/Makassar', created_at))::date) stored
);

create unique index if not exists ux_checkins_user_day on public.checkins(user_id, checkin_day);
create index if not exists idx_checkins_created_at on public.checkins(created_at desc);

create table if not exists public.community_posts (
  id bigserial primary key,
  author_name text not null,
  content text not null check (char_length(content) <= 280),
  likes integer not null default 0 check (likes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_community_posts_created_at on public.community_posts(created_at desc);
