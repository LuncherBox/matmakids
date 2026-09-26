# Eduli universal migration audit

Updated: 2026-09-26

## Current production frontend

The production prototype currently lives at repository root and is intentionally left untouched while the new universal frontend is built.

Key files:
- `index.html` - legacy app shell
- `app.js` - legacy navigation, auth, parent/child flows, task engine and mission logic
- `styles.css` - legacy visual layer
- `tasks.json` - current task bank
- `config.js` - current browser Supabase configuration
- `supabase/` - schema/RLS documentation, currently known to require reconciliation with the live project

## Durable backend already in use

The new frontend must use the same Supabase project and preserve:
- Supabase Auth users
- parents
- children
- parent_children
- sessions
- session_answers
- child_task_type_progress
- existing RPCs used to create/join shared child profiles

## Logic that must be preserved during migration

- shared child profiles across adult accounts
- age derived from `birth_date`
- Eduli eligibility age 4-8
- mission length: 10 tasks
- mission gating by learned mechanics
- mission scoring child vs Gobi
- hint / guided help state
- task attempts and first-try correctness
- persisted session answers
- mission recovery after interruption
- Training -> learned mechanic
- Practice mode
- current task renderer behavior
- public demo does not write learning results to Supabase

## Migration strategy

The legacy frontend remains the reference implementation until the Expo app reaches functional parity.

New universal frontend location:
- `apps/eduli/`

The root Railway app remains unchanged during the first migration phases.

## First proof milestone

The first proof is successful when:
1. the Expo web app opens,
2. an existing Eduli parent logs in with the same credentials,
3. the same existing child profiles appear,
4. opening a child reads the existing profile from Supabase,
5. no migration or duplicate account is required.

## Known technical debt

- `supabase/schema.sql` and `supabase/rls.sql` require reconciliation with the live Supabase project.
- `docs/PROTOTYPE_BUILD_PLAN.md` describes the older prototype and is historical.
- legacy business rules are still mixed into `app.js`; they will be extracted during migration.
