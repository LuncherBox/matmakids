-- Eduli universal progression foundation.
-- PREPARED MIGRATION - apply to the existing Supabase project after review.
--
-- The model keeps mechanics cumulative across levels:
-- learning a higher band of addition does not remove lower addition tasks.
-- A "skill band" is a mechanic + difficulty band, e.g. math:addition / band 1.

alter table public.children
  add column if not exists progression_level integer;

alter table public.children
  drop constraint if exists children_progression_level_check;

alter table public.children
  add constraint children_progression_level_check
  check (progression_level is null or progression_level between 0 and 20);

alter table public.sessions
  add column if not exists learning_level integer;

alter table public.sessions
  drop constraint if exists sessions_learning_level_check;

alter table public.sessions
  add constraint sessions_learning_level_check
  check (learning_level is null or learning_level between 0 and 20);

create table if not exists public.child_skill_band_progress (
  child_id uuid not null references public.children(id) on delete cascade,
  task_type text not null,
  difficulty_band integer not null check (difficulty_band between 0 and 20),
  training_status text not null default 'new'
    check (training_status in ('new','training','learned')),
  unlocked_level integer
    check (unlocked_level is null or unlocked_level between 0 and 20),
  training_attempts integer not null default 0 check (training_attempts >= 0),
  successful_tasks integer not null default 0 check (successful_tasks >= 0),
  first_try_tasks integer not null default 0 check (first_try_tasks >= 0),
  hint_tasks integer not null default 0 check (hint_tasks >= 0),
  guided_help_tasks integer not null default 0 check (guided_help_tasks >= 0),
  learned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, task_type, difficulty_band)
);

create index if not exists idx_child_skill_band_progress_child
  on public.child_skill_band_progress(child_id);

create index if not exists idx_child_skill_band_progress_level
  on public.child_skill_band_progress(child_id, unlocked_level);

alter table public.child_skill_band_progress enable row level security;

drop policy if exists "Linked parents can read child skill bands"
  on public.child_skill_band_progress;
create policy "Linked parents can read child skill bands"
on public.child_skill_band_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.parent_children pc
    where pc.child_id = child_skill_band_progress.child_id
      and pc.parent_id = auth.uid()
  )
);

drop policy if exists "Linked parents can insert child skill bands"
  on public.child_skill_band_progress;
create policy "Linked parents can insert child skill bands"
on public.child_skill_band_progress
for insert
to authenticated
with check (
  exists (
    select 1
    from public.parent_children pc
    where pc.child_id = child_skill_band_progress.child_id
      and pc.parent_id = auth.uid()
  )
);

drop policy if exists "Linked parents can update child skill bands"
  on public.child_skill_band_progress;
create policy "Linked parents can update child skill bands"
on public.child_skill_band_progress
for update
to authenticated
using (
  exists (
    select 1
    from public.parent_children pc
    where pc.child_id = child_skill_band_progress.child_id
      and pc.parent_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.parent_children pc
    where pc.child_id = child_skill_band_progress.child_id
      and pc.parent_id = auth.uid()
  )
);

comment on column public.children.progression_level is
  'Current adaptive Eduli learning level. 0 is the pre-foundation band. NULL means placement has not been completed yet.';

comment on column public.sessions.learning_level is
  'Learning/progression level used when the mission session was created.';

comment on table public.child_skill_band_progress is
  'Per-child cumulative mastery history for mechanic + difficulty band.';


-- Backfill current learned mechanics into difficulty band 1.
-- This preserves existing progress without deciding the child's new progression_level.
insert into public.child_skill_band_progress (
  child_id,
  task_type,
  difficulty_band,
  training_status,
  unlocked_level,
  training_attempts,
  learned_at,
  updated_at
)
select
  p.child_id,
  p.task_type,
  1,
  'learned',
  1,
  greatest(coalesce(p.training_attempts, 0), 1),
  coalesce(p.trained_at, now()),
  now()
from public.child_task_type_progress p
where p.training_status = 'learned'
on conflict (child_id, task_type, difficulty_band)
do update set
  training_status = excluded.training_status,
  training_attempts = greatest(
    public.child_skill_band_progress.training_attempts,
    excluded.training_attempts
  ),
  learned_at = coalesce(
    public.child_skill_band_progress.learned_at,
    excluded.learned_at
  ),
  updated_at = now();
