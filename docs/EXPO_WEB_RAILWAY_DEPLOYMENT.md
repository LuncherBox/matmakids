# Expo Web deployment on Railway

Date: 2026-10-01

Goal:
- deploy the new Expo Web app from `apps/eduli`
- keep the legacy root Railway service unchanged
- use the same Supabase backend
- validate the new frontend on a separate staging URL before any production cutover

## Important repository rule

Do not modify the existing root Railway service.

The root service continues to use:
- repository root
- root `package.json`
- legacy static frontend
- current production domain

Create a second Railway service for Expo Web.

## Railway service settings

Source repository:
- `LuncherBox/matmakids`

Recommended service name:
- `eduli-universal-staging`

Root Directory:
- `/apps/eduli`

Watch Path:
- `/apps/eduli/**`

Build Command:
- `npm run build:web`

Start Command:
- `npm run serve:web`

Healthcheck Path:
- `/`

Public Networking:
- enabled

The app exports static Web output to `apps/eduli/dist`.
The start command serves that directory with SPA fallback and binds to Railway's `$PORT`.

## Required environment variables

Set on the new Expo service only:

```
EXPO_PUBLIC_SUPABASE_URL=<current shared Supabase project URL>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<current publishable key>
EXPO_PUBLIC_APP_URL=<staging Railway public URL>
```

Do not create another Supabase project.

## Authentication checks

Before treating staging as usable:

1. Add the staging app URL to the allowed redirect URLs in the existing Supabase Auth configuration where required.
2. Verify email/password login.
3. Verify password reset return flow.
4. Verify Google Web login.
5. Verify an existing parent sees the same existing child profiles.

## Staging smoke test

Parent mode:
- public landing loads
- login/register/reset flow loads
- existing parent login works
- child list loads
- child profile loads
- edit profile works
- stats/report load

Child mode:
- handoff works
- onboarding routing works
- Practice works
- Mission starts only when progression gate allows it
- memory tasks survive refresh correctly
- result screen loads
- exit back to parent works

Responsive:
- 320 px browser width
- 360 px browser width
- regular phone width
- desktop browser width

Persistence:
- session rows are created in the existing Supabase project
- answers are written once
- no duplicate child/profile data is created

## Rollback

Before production cutover:
- legacy Railway service remains untouched and remains the rollback target

If staging fails:
- do not change the legacy service
- fix Expo in `apps/eduli`
- redeploy only the Expo service

For the future production cutover:
- preserve the legacy service until the new domain has been validated
- domain switching should be a separate release step
- do not delete the legacy deployment during initial cutover

## Current Railway note

Railway's current guidance supports monorepo services through a per-service Root Directory.
Build and Start Commands should be configured in service settings.

Do not add a new `railway.toml` for this service. Railway Config as Code is deprecated for new services and scheduled for removal for existing usage.
