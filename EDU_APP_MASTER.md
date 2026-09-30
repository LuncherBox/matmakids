# EDU_APP_MASTER.md

## 1. Project purpose

Eduli is an educational app for children aged 4-8.

Primary goals:
- practice basic math
- develop logic
- develop computational thinking and coding skills
- train memory
- keep sessions short, simple and attractive
- let parents understand the child's activity and progress
- preserve one shared product and backend across Web, Android and iOS

## 2. Source of truth and repository rules

Repository:
- `LuncherBox/matmakids`
- active branch: `main`

This file is the project-wide source of truth for product, architecture and migration decisions.

Before substantial development work:
- read the current version of this file
- inspect the current code before implementing anything
- do not rely only on older documentation or historical root files

Legacy production:
- the existing HTML/CSS/JS frontend remains in repository root
- it is deployed through Railway
- it must remain working and untouched as the reference implementation until the Expo app reaches functional parity
- do not remove or rewrite the legacy root app during migration

New universal app:
- `apps/eduli/`

## 3. Target architecture

Frontend:
- Expo
- React Native
- TypeScript
- Expo Router
- React Native Web

The same frontend should support:
- Web
- Android
- iOS

Backend remains shared:
- Supabase Auth
- existing Supabase Postgres
- existing parent and child profiles
- `parent_children`
- `sessions`
- `session_answers`
- `child_task_type_progress`
- existing RPCs for creating and joining child profiles

Architecture rule:
- a user created on Web must later be able to sign into Android or iOS and see the same children, points, missions, history, reports and progress
- do not create a separate mobile data model or duplicate user store

## 4. Product contexts

### Parent mode

Parent mode includes:
- child list
- add child
- join child by code
- child profile
- edit child
- sharing code
- statistics
- educational report
- "Przekaż telefon dziecku"

### Child mode

Child mode is a separate full-screen context.

It includes:
- child home
- Misja z Gobim
- Ćwicz
- Moje wyniki
- first-entry onboarding
- exit back to parent mode

The same child profile is used in both modes, but UI and information scope are separated.

## 5. Current Expo implementation

Already implemented:
- [x] Expo + React Native + TypeScript + Expo Router project
- [x] shared connection to the current Supabase project
- [x] Supabase environment configuration
- [x] public start screen
- [x] email/password login
- [x] registration
- [x] password reset request
- [x] new password flow
- [x] Google login on Web
- [x] existing child list from Supabase
- [x] create child
- [x] join child by code
- [x] edit child profile
- [x] shared age rules for ages 4-8 based on `birth_date`
- [x] parent child profile view
- [x] parent statistics
- [x] task count
- [x] mission count
- [x] first-try accuracy
- [x] hints
- [x] category results
- [x] streak
- [x] mission history
- [x] basic educational report
- [x] stronger/weaker area
- [x] "Przekaż telefon dziecku" screen
- [x] separate child home
- [x] child points, missions and streak
- [x] child CTA: Misja / Ćwicz / Moje wyniki
- [x] child-friendly results
- [x] practice category selection

## 6. Task bank and task architecture

Current Expo task bank:
- `apps/eduli/assets/tasks.json`
- 160 tasks at the current migration baseline
- shared TypeScript `Task` type
- task-bank logic separated from screen UI

Mechanic IDs use stable technical keys such as:
- `math:addition`
- `logic:sudoku_4x4`

Data convention:
- all technical keys, table names, enums and JSON keys use English
- child-facing content may be Polish

Mission may use only mechanics already learned by the child.
New mechanics are introduced only through Training / Ćwicz.

## 7. Mission rules

Current mission:
- 10 tasks
- mixed learned mechanics only
- currently requires at least 3 learned mechanics
- child vs Gobi
- session stored in `sessions`
- answers stored in `session_answers`
- wrong answers can be corrected
- active mission has local snapshot recovery
- final result is stored

Scoring:
- each task starts with potential 2 child points
- correct first try without a hint: child +2, Gobi 0
- wrong answer followed by correction: child +1, Gobi +1
- Level 1/base hint: child can earn +1, Gobi 0
- at higher `gobi_level`, using a hint may give Gobi +1
- repeated mistakes never give Gobi additional points for the same task

## 8. Training / Practice rules

Current Training / Ćwicz:
- mechanics are listed by category
- mechanic status is new or learned
- new mechanic starts with 2 training tasks
- successful training marks the mechanic as `learned`
- learned mechanic uses 5 practice tasks

Progression requires two independent dimensions:
1. mechanic familiarity - whether the child knows the mechanic
2. mechanic mastery/difficulty - how advanced the child is within that mechanic

Progression is cumulative:
- old mechanics do not disappear at higher levels
- difficulty increases within the same mechanic
- Level 0 must support children learning counting, digits and simple operations up to 5/10

The Expo code now has a level-aware skill-band path:
- each mechanic can have cumulative difficulty bands
- Practice trains the highest available band that does not exceed the child's progression level
- learned higher bands keep easier tasks available for repetition
- Mission selects only tasks covered by learned skill bands when the progression schema is available
- onboarding and Mission use one shared progression gate
- the legacy learned-mechanic fallback remains active until migration 13 is applied to the production Supabase project

The current bank contains difficulty bands 1 and 2 only. There are currently no published difficulty-band 0 tasks, so Level 0 selection logic is implemented but Level 0 content is still missing.

## 9. Renderer migration status

Simple renderers already migrated:
- [x] addition
- [x] subtraction
- [x] missing number
- [x] number order
- [x] number comparison
- [x] visual sequences
- [x] command pattern
- [x] simple path planning

Complex renderers already present in the Expo task engine:
- [x] `sudoku_grid`
- [x] `color_grid_copy`
- [x] `visual_search`
- [x] `symbol_code`
- [x] `binary_grid_copy`
- [x] `image_memory`
- [x] `location_memory_grid`
- [x] `sequence_memory`
- [x] `number_memory`
- [x] `pair_memory`
- [x] interactive dots for addition
- [x] interactive dots for subtraction

Important:
- renderer presence does not automatically mean full parity in Mission
- every renderer must be validated in Training, Practice and Mission where applicable
- memory mechanics need special care around refresh/interruption because memorize/answer phase state must not create an accidental replay advantage

## 10. Interaction rules

### General
- one clear action per screen
- minimal reading burden
- large touch targets
- phone-first layout
- immediate understandable feedback
- feedback must not cover answer controls
- errors must allow retry
- no punishment loops
- no addictive infinite loop

### Math with dots
- equation remains the main task
- dots are visual support
- dots stay secondary
- subtraction may use visibly removed/crossed-out items

### Missing number
- target position must be clearly highlighted
- a question mark alone is not enough

### Symbol code
- legend remains visible
- do not require memorizing mappings
- use in-app letter controls instead of native phone keyboard
- provide delete/backspace

### Pattern copying
- reference grid remains visible
- editable grid is separate
- child recreates the pattern directly
- do not replace this with multiple choice

### Memory
- memory tasks have at least `memorize` and `answer` phases
- the stimulus is shown first, then hidden
- younger children should rely mainly on visual stimuli
- phase transitions must be controlled by the renderer

## 11. Migration checklist

### Task engine and renderers
- [x] shared task type
- [x] bank logic extracted from UI
- [x] stable mechanic IDs
- [x] simple renderer set migrated
- [x] complex grid renderers migrated
- [x] memory renderers migrated into `TaskInteraction`
- [x] interactive math dots migrated
- [x] validate every published renderer against current `tasks.json`
- [ ] add renderer-level regression tests for pure validation/helpers
- [ ] verify responsive behavior for small phones and Web

### Mission
- [x] 10-task mission
- [x] learned-mechanics-only selection
- [x] scoring module separated from UI
- [x] session creation and answer persistence
- [x] correction after wrong answer
- [x] mission finish result
- [x] local active-mission snapshot
- [x] validate restored snapshot against live Supabase session status
- [x] make interruption recovery safe for memory-task phase state
- [x] extend Mission to memory mechanics after recovery behavior is safe
- [x] replace temporary 3-mechanic gate with level/progression rules in the Expo code path
- [ ] apply progression migration 13 to production Supabase after review
- [x] generalize Level 1 hints across renderers
- [x] generalize guided help after an error across renderers

### Training / Practice
- [x] new vs learned mechanic list
- [x] 2-task training for new mechanics
- [x] persist `learned`
- [x] 5-task practice for learned mechanics
- [x] add progression-aware difficulty-band selection per mechanic
- [ ] add mastery advancement rules and update per-band mastery counters
- [x] introduce Level 0 selection rules
- [ ] add published Level 0 task content

### Product / platform
- [x] parent and child contexts separated
- [x] shared Supabase user and child data
- [ ] complete parity review against legacy production
- [ ] deployment configuration for new Expo Web without breaking legacy Railway app
- [ ] Android build validation
- [ ] iOS build validation
- [ ] release checklist and rollback plan

## 12. Current priority

Current priority:
1. finish task-engine parity in Expo
2. make full Training / Ćwicz usable with most current task types
3. make full Mission usable with most current task types
4. harden hints, guided help and interruption recovery
5. only then polish final visual design

Do not spend time on final UI polish if it blocks mechanics, correctness, persistence or cross-platform architecture.

## 13. Conversation split

### Main developer chat

Scope:
- architecture
- frontend implementation
- parent/child product flow
- UI/UX mechanics
- responsiveness
- Supabase integration
- regression prevention
- migration checklist
- deployment readiness

### Task/content chat

Scope:
- task ideas and wording
- educational correctness
- task difficulty
- answers and hints
- task-bank content
- future educational domains

When task content requires a new interaction type, record the interaction requirement here so the developer chat can implement it.
