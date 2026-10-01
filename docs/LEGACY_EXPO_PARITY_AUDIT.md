# Legacy vs Expo functional parity audit

Date: 2026-10-01

Compared:
- legacy root frontend: `index.html`, `app.js`, `tasks.json`
- universal Expo frontend: `apps/eduli`

Goal:
- verify functional migration parity before any production cutover
- distinguish real user-facing legacy behavior from unused/dead legacy code

## Task bank

Status: parity

- legacy tasks: 160
- Expo tasks: 160
- task IDs: identical
- renderer set: identical
- category totals: identical
  - math: 40
  - logic: 40
  - coding: 40
  - memory: 40

Current renderer set:
- equation_with_dots
- missing_number_equation
- number_sequence
- number_comparison
- sudoku_grid
- color_grid_copy
- visual_search
- visual_sequence
- symbol_code
- binary_grid_copy
- command_pattern
- command_grid_plan
- image_memory
- location_memory_grid
- sequence_memory
- number_memory
- pair_memory

## Public entry and demo

Status: parity with one intentional migration fix

Both provide:
- public landing
- no-account demo
- 10-task demo
- CTA to create an account

Legacy demo selection:
- 4 math
- 4 logic
- 2 coding
- no memory

Expo originally selected any 10 supported non-memory tasks.
This audit changed Expo to the same balanced 4/4/2 mix.

## Authentication

Status: parity on Web

Both provide:
- email/password login
- account registration
- password reset request
- new-password flow
- Google OAuth on Web
- logout

Expo keeps Google OAuth explicitly Web-only for now.
Native OAuth validation remains part of later Android/iOS release work.

## Parent and child profiles

Status: parity or better

Both support:
- list existing child profiles
- create child
- join child using share code
- edit child
- shared Supabase child data
- parent -> child handoff

Expo additionally separates parent and child navigation contexts more explicitly.

## Child home and Practice

Status: parity or better

Both support:
- child home
- category selection
- mechanic selection
- short training for new mechanics
- repeated practice for learned mechanics

Expo additionally includes:
- skill-band-aware progression path
- cumulative difficulty-band selection
- mastery counters when migration 13 is available

Legacy compatibility remains available until migration 13 is applied.

## Mission

Status: parity or better

Both support:
- 10 tasks
- child vs Gobi scoring
- first-try scoring
- mistakes and retry
- hints
- guided help
- persistence to sessions/session_answers
- mission finish result
- mission recovery

Expo additionally:
- validates recovered session status against Supabase
- prevents stale snapshots
- preserves memory-task phase/deadline across interruption
- supports memory mechanics in Mission
- records per-band mastery counters when available

## Task interactions

Status: parity

All 17 currently published renderers are available in Expo.

Expo validation is additionally covered by pure helper tests for:
- scalar answers
- Sudoku
- grid copying
- visual search
- symbol code

Complex grids also adapt to narrow phone widths.

## Statistics and educational report

Status: Expo exceeds legacy baseline

Expo includes:
- total tasks
- missions
- first-try accuracy
- hints
- active days
- streak
- recent mission history
- category performance
- mechanic performance
- stronger/weaker areas
- educational report

## Legacy instruction audio

Status: not a functional parity blocker

Legacy `app.js` contains an `INSTRUCTION_AUDIO` map and playback code.
However the repository contains no referenced MP3/WAV/OGG/M4A files.

Therefore:
- the code path exists in legacy
- required audio assets are absent from the repository
- there is no complete legacy asset set to migrate

Audio should be treated as a future product feature unless valid source assets are supplied.

## Legacy renderer helpers not used by the current bank

Legacy contains helper/render functions for additional historical interactions such as spatial/pattern variants.

They are not used by any of the current 160 task records.
They are therefore not required for parity with the current published task bank.

## Responsive behavior

Status: code-level audit complete

Expo now has:
- compact phone rules for 320-360 px
- responsive complex grids
- responsive child/parent cards and headings
- flexible long-label rows

Manual Android/iOS device/simulator testing is still required before native release.

## Deployment

Status: staging configuration prepared

Expo Web can be deployed as a second Railway service using:
- root directory: `/apps/eduli`
- build: `npm run build:web`
- start: `npm run serve:web`

The root legacy Railway service remains untouched.

See:
- `docs/EXPO_WEB_RAILWAY_DEPLOYMENT.md`

## Open parity/release gates

Functional Web parity is considered code-complete for the current 160-task product scope.

Remaining release gates are operational/platform gates rather than missing legacy functionality:
- create and smoke-test isolated Expo Web staging service
- apply migration 13 only after review/backup
- Android validation
- iOS validation
- final release/cutover checklist
- rollback rehearsal/confirmation
