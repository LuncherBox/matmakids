# Migration 13 rollout plan - progression skill bands

Migration:
- `supabase/migrations/13_progression_skill_bands.sql`

Status:
- prepared in repository
- NOT applied to production by this work
- Expo app contains compatibility fallbacks until the migration is live

## Goal

Introduce durable progression data without breaking the existing production frontend:

- `children.progression_level`
- `sessions.learning_level`
- `child_skill_band_progress`

Existing learned mechanics remain preserved in `child_task_type_progress`.
The migration backfills learned mechanics into difficulty band 1.

## Pre-deployment checks

Before applying:

1. Confirm the target Supabase project is the current shared production backend.
2. Create a database backup / point-in-time restore checkpoint.
3. Confirm current counts:
   - children
   - learned rows in `child_task_type_progress`
   - sessions
4. Confirm migration 12 status separately. Migration 13 must not be used as a substitute for onboarding migration 12.
5. Review RLS policies for `parent_children` authorization.
6. Confirm no table or column with conflicting types already exists.

Read-only precheck queries:

```sql
select count(*) as children_count from public.children;

select count(*) as learned_mechanics
from public.child_task_type_progress
where training_status = 'learned';

select count(*) as sessions_count from public.sessions;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('children', 'sessions')
  and column_name in ('progression_level', 'learning_level');

select to_regclass('public.child_skill_band_progress') as skill_band_table;
```

## Apply strategy

Apply the migration once through the normal Supabase SQL/migration path.

Do not manually reproduce only selected statements from the migration.
The column additions, constraints, table, indexes, RLS and backfill belong to one rollout.

## Immediate post-migration validation

Run:

```sql
select count(*) as learned_skill_bands
from public.child_skill_band_progress
where training_status = 'learned';

select count(*) as legacy_learned
from public.child_task_type_progress
where training_status = 'learned';

select count(*) as missing_backfill
from public.child_task_type_progress p
where p.training_status = 'learned'
  and not exists (
    select 1
    from public.child_skill_band_progress b
    where b.child_id = p.child_id
      and b.task_type = p.task_type
      and b.difficulty_band = 1
      and b.training_status = 'learned'
  );
```

Expected:
- `missing_backfill = 0`
- existing child/session counts unchanged
- legacy table remains intact

Also verify:

```sql
select
  relname,
  relrowsecurity
from pg_class
where relname = 'child_skill_band_progress';

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'child_skill_band_progress';
```

## Application smoke test after migration

Use one test parent / child profile.

1. Sign in.
2. Open child profile.
3. Enter child mode.
4. Open Practice.
5. Complete a new mechanic training.
6. Confirm a learned row exists in `child_skill_band_progress`.
7. Practice the learned mechanic.
8. Confirm mastery counters increase.
9. Run a Mission.
10. Confirm:
    - Mission can select learned-band tasks
    - `sessions.learning_level` is written when `progression_level` is set
    - `session_answers` still records answers
    - legacy `child_task_type_progress` still works
11. Confirm a second linked parent retains access through RLS if applicable.

## Important placement rule

Migration 13 intentionally leaves existing `children.progression_level` as NULL.

Do not bulk-assign levels during the schema migration.

Initial placement and automatic mastery promotion need an explicit product/educational rule.
Until that rule is approved:
- existing users keep compatibility behavior
- skill-band history can be collected
- no arbitrary automatic promotion threshold should be introduced

## Rollback

The migration is additive and preserves the legacy progress table.

Preferred rollback if application behavior is wrong:
1. keep the new columns/table in place
2. deploy/revert Expo code to the legacy fallback path
3. investigate before destructive database rollback

Do not drop `child_skill_band_progress` after users have started generating new progression data unless a verified backup exists.

A destructive SQL rollback should be treated as a separate reviewed migration, not an ad-hoc console action.

## Release gate

Migration 13 can be considered ready to apply only when:

- [ ] production backup/restore point exists
- [ ] precheck queries are clean
- [ ] migration SQL has been reviewed
- [ ] Expo Web current CI is green
- [ ] a test child/account is available for smoke testing
- [ ] post-migration SQL checks are ready
- [ ] rollback owner and procedure are clear
