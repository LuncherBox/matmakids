-- Row Level Security for prototype data isolation

alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.sessions enable row level security;
alter table public.session_answers enable row level security;

drop policy if exists "parent can read own parent row" on public.parents;
create policy "parent can read own parent row"
on public.parents for select
using (id = auth.uid());

drop policy if exists "parent can update own parent row" on public.parents;
create policy "parent can update own parent row"
on public.parents for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "parent can read own children" on public.children;
create policy "parent can read own children"
on public.children for select
using (parent_id = auth.uid());

drop policy if exists "parent can create own children" on public.children;
create policy "parent can create own children"
on public.children for insert
with check (parent_id = auth.uid());

drop policy if exists "parent can update own children" on public.children;
create policy "parent can update own children"
on public.children for update
using (parent_id = auth.uid())
with check (parent_id = auth.uid());

drop policy if exists "parent can delete own children" on public.children;
create policy "parent can delete own children"
on public.children for delete
using (parent_id = auth.uid());

drop policy if exists "parent can read child sessions" on public.sessions;
create policy "parent can read child sessions"
on public.sessions for select
using (
  exists (
    select 1 from public.children c
    where c.id = sessions.child_id
      and c.parent_id = auth.uid()
  )
);

drop policy if exists "parent can create child sessions" on public.sessions;
create policy "parent can create child sessions"
on public.sessions for insert
with check (
  exists (
    select 1 from public.children c
    where c.id = sessions.child_id
      and c.parent_id = auth.uid()
  )
);

drop policy if exists "parent can update child sessions" on public.sessions;
create policy "parent can update child sessions"
on public.sessions for update
using (
  exists (
    select 1 from public.children c
    where c.id = sessions.child_id
      and c.parent_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.children c
    where c.id = sessions.child_id
      and c.parent_id = auth.uid()
  )
);

drop policy if exists "parent can read own session answers" on public.session_answers;
create policy "parent can read own session answers"
on public.session_answers for select
using (
  exists (
    select 1
    from public.sessions s
    join public.children c on c.id = s.child_id
    where s.id = session_answers.session_id
      and c.parent_id = auth.uid()
  )
);

drop policy if exists "parent can create own session answers" on public.session_answers;
create policy "parent can create own session answers"
on public.session_answers for insert
with check (
  exists (
    select 1
    from public.sessions s
    join public.children c on c.id = s.child_id
    where s.id = session_answers.session_id
      and c.parent_id = auth.uid()
  )
);

drop policy if exists "parent can update own session answers" on public.session_answers;
create policy "parent can update own session answers"
on public.session_answers for update
using (
  exists (
    select 1
    from public.sessions s
    join public.children c on c.id = s.child_id
    where s.id = session_answers.session_id
      and c.parent_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.sessions s
    join public.children c on c.id = s.child_id
    where s.id = session_answers.session_id
      and c.parent_id = auth.uid()
  )
);
