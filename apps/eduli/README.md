# Eduli universal app

New frontend for Eduli built with Expo, React Native and TypeScript.

This app uses the existing Supabase project. The legacy production frontend at repository root remains untouched during migration.

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in the same Supabase project URL and publishable key used by the current web app.
3. Install dependencies:

```bash
npm install
```

4. Start web:

```bash
npm run web
```

5. Architecture proof:
- open the Expo web app,
- log in with an existing Eduli parent account,
- verify that the existing child profiles appear.

Do not create a second Supabase project for this frontend.


## Current migration status

The universal frontend now contains:
- shared Supabase authentication and protected routes
- parent child-list/profile/statistics/report flows
- explicit parent-to-child handoff
- child home, Practice/Training, results and 10-task Gobi mission
- reusable task interactions for math, logic, coding and memory
- no-account 10-task public demo

The legacy root frontend stays live until the Expo web build reaches verified parity.


## Build and release references

Web staging / Railway:
- `docs/EXPO_WEB_RAILWAY_DEPLOYMENT.md`

Progression migration 13:
- `docs/PROGRESSION_MIGRATION_13_ROLLOUT.md`

Legacy vs Expo parity:
- `docs/LEGACY_EXPO_PARITY_AUDIT.md`

Release and rollback:
- `docs/RELEASE_CHECKLIST.md`

Responsive audit:
- `docs/RESPONSIVE_AUDIT.md`

Production rule:
- keep the legacy root Railway service untouched until Expo Web staging passes smoke tests and production cutover is explicitly performed.
