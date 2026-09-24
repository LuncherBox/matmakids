# Prototype Build Plan

## Goal

Build the next multi-family prototype described in EDU_APP_MASTER:
- parent registration/login/logout
- one parent can own multiple child profiles
- parent selects a child
- child completes a 10-task "Pokonaj Gobiego" mixed session
- child and Gobi receive points
- session and per-task results are persisted
- cumulative history survives logout, another device and later days
- parent can see a simple activity/results summary

## Technical choice

Use Supabase for the prototype backend:
- Supabase Auth for parent authentication
- PostgreSQL for relational data
- Row Level Security for parent/child data isolation
- current static HTML/CSS/JS frontend can stay on Railway
- tasks remain in tasks.json for now
- backend design remains compatible with future PWA/mobile clients

Do not expose a Supabase service-role key in the frontend. The browser may use only the public anon key.

## Core data model

Parent
- id
- email
- created_at

Child
- id
- parent_id
- display_name
- age
- created_at

Session
- id
- child_id
- started_at
- completed_at
- status: started | completed | abandoned
- task_count
- correct_first_try_count
- mistake_count
- child_points
- gobi_points
- winner: child | gobi | draw
- mode: mixed | category
- category (nullable)

SessionAnswer
- id
- session_id
- task_id
- category
- attempts
- correct_first_try
- points_child
- points_gobi
- created_at

## Build order

### Phase 1 - Backend foundation
1. Create Supabase project.
2. Run supabase/schema.sql.
3. Run supabase/rls.sql.
4. Configure email/password auth.
5. Add frontend config with project URL + anon key.
6. Add a small API/data layer in the frontend instead of calling Supabase from UI functions directly.

Acceptance:
- parent can register/login/logout
- signed-in parent exists in parents table
- parent cannot access another parent's children/sessions

### Phase 2 - Parent and child flow
1. Registration screen.
2. Login screen.
3. Password reset if straightforward.
4. Child list.
5. Create child: display_name + age.
6. Select active child.
7. Store selected child only as UI state/local convenience; database remains source of truth.

Acceptance:
- one parent can create at least two children
- after logout/login children are still present
- another account cannot see them

### Phase 3 - Persist the existing 10-task session
1. Keep current task renderer/UI.
2. When session starts, insert Session(status=started).
3. Track attempts per task.
4. On completion of each task, insert/update SessionAnswer.
5. After task 10, update Session(status=completed) and aggregates.
6. If user exits, mark Session abandoned.

Acceptance:
- completed session contains exactly 10 answers
- retries and first-try correctness are preserved
- reload/login on another device still shows stored history

### Phase 4 - Gobi duel
Scoring must be explicitly approved before implementation.

Current candidate from master:
- correct first attempt: child +2
- correct after earlier mistake: child +1
- first wrong attempt: Gobi +1
- child may always correct the task

Implementation after approval:
1. Add score state to running session.
2. Save per-answer points to SessionAnswer.
3. Show child vs Gobi score without covering task content.
4. Replace finish screen with duel result.
5. Add Gobi win/loss reaction.

### Phase 5 - Child home and parent summary
1. Child home with primary "Pokonaj Gobiego".
2. "Ćwicz" category mode.
3. Child results: completed sessions, tasks, wins, total points.
4. Parent summary: sessions, tasks, first-try rate, activity days, category results.

## Session state rules

A standard mixed session:
- exactly 10 tasks when completed
- Session is created before first task
- each task keeps attempts counter
- selecting an answer does not count as an attempt
- tapping SPRAWDŹ counts as an attempt
- first wrong SPRAWDŹ can award Gobi only once per task if scoring rule is approved
- task remains solvable after a mistake
- completed_at is set only after all 10 tasks
- explicit exit marks session abandoned

## Publication rule to implement

Runtime tasks should eventually be served only when:
- status = approved
- active = true

Current task-bank publication is not yet fully reconciled. Before multi-family testing this must be fixed so draft/inactive content is not unintentionally served.

## Out of scope now
- payments
- referrals
- social features
- public rankings
- complex avatars
- parent-defined physical rewards
- advanced streaks
- AI recommendations
- new educational domains
