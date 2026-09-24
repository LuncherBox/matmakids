-- Supabase / PostgreSQL schema for the multi-family prototype

create extension if not exists pgcrypto;

create table if not exists public.parents (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  age integer not null check (age between 4 and 8),
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'started' check (status in ('started','completed','abandoned')),
  task_count integer not null default 0 check (task_count >= 0),
  correct_first_try_count integer not null default 0 check (correct_first_try_count >= 0),
  mistake_count integer not null default 0 check (mistake_count >= 0),
  child_points integer not null default 0 check (child_points >= 0),
  gobi_points integer not null default 0 check (gobi_points >= 0),
  winner text check (winner is null or winner in ('child','gobi','draw')),
  mode text not null default 'mixed' check (mode in ('mixed','category')),
  category text
);

create table if not exists public.session_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  task_id text not null,
  category text not null,
  attempts integer not null default 0 check (attempts >= 0),
  correct_first_try boolean not null default false,
  points_child integer not null default 0 check (points_child >= 0),
  points_gobi integer not null default 0 check (points_gobi >= 0),
  created_at timestamptz not null default now(),
  unique (session_id, task_id)
);

create index if not exists idx_children_parent_id on public.children(parent_id);
create index if not exists idx_sessions_child_id on public.sessions(child_id);
create index if not exists idx_sessions_started_at on public.sessions(started_at desc);
create index if not exists idx_session_answers_session_id on public.session_answers(session_id);
create index if not exists idx_session_answers_task_id on public.session_answers(task_id);

-- Automatically mirror a new auth user into public.parents.
create or replace function public.handle_new_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.parents (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_parent();
