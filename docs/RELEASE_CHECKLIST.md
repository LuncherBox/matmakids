# Eduli universal release checklist and rollback plan

Date: 2026-10-01

Scope:
- Expo Web first
- Android/iOS later
- existing legacy Railway deployment remains available during migration

## 1. Code gate

Before staging deploy:

- [ ] latest `main` CI is green
- [ ] typecheck passes
- [ ] unit tests pass
- [ ] Expo Web export passes
- [ ] no unreviewed production Supabase migration is bundled into frontend release work
- [ ] `EDU_APP_MASTER.md` reflects current state

## 2. Staging Web gate

Deploy a separate Railway service using:
- Root Directory: `/apps/eduli`
- Build Command: `npm run build:web`
- Start Command: `npm run serve:web`

Required checks:
- [ ] staging domain loads
- [ ] public landing works
- [ ] public demo works
- [ ] registration works
- [ ] email/password login works
- [ ] Google Web login works
- [ ] password reset works
- [ ] existing parent sees existing children
- [ ] create child works
- [ ] join child works
- [ ] edit child works
- [ ] parent stats/report work
- [ ] child handoff works
- [ ] onboarding works
- [ ] Practice works
- [ ] Mission works
- [ ] memory Mission refresh recovery works
- [ ] exit Mission works
- [ ] child results work
- [ ] 320 px smoke test
- [ ] 360 px smoke test
- [ ] desktop smoke test

## 3. Supabase progression migration gate

Migration 13 is a separate release operation.

Before applying:
- [ ] backup / restore point confirmed
- [ ] prechecks from `docs/PROGRESSION_MIGRATION_13_ROLLOUT.md` pass
- [ ] migration reviewed
- [ ] staging frontend is stable before schema change
- [ ] test child/account available

After applying:
- [ ] backfill missing count = 0
- [ ] legacy learned rows remain intact
- [ ] RLS access verified
- [ ] skill-band training write verified
- [ ] mastery counter write verified
- [ ] Mission learning level write verified when progression_level is set

Do not assign arbitrary progression levels as part of the migration.

## 4. Web production cutover gate

Before changing the production domain:
- [ ] staging has passed all checks
- [ ] production Supabase auth redirect URLs include final Expo Web domain
- [ ] legacy Railway service is still healthy
- [ ] current legacy domain configuration is recorded
- [ ] Expo service has a stable deployment
- [ ] rollback owner is known
- [ ] no destructive database change is pending

Cutover:
1. Point the intended production domain to the Expo Web service.
2. Keep the legacy service running.
3. Run immediate smoke tests:
   - public landing
   - login
   - existing child list
   - Practice
   - Mission
4. Observe auth/session errors and Supabase writes.
5. Do not delete the legacy service.

## 5. Web rollback

If frontend cutover fails:

1. Restore the production domain to the legacy Railway service.
2. Do not delete new Expo data or schema immediately.
3. Keep migration 13 in place if already applied unless it is proven to be the cause.
4. Use the Expo compatibility fallback or revert the frontend commit as needed.
5. Investigate in staging.
6. Reattempt cutover only after the failing flow is reproduced and fixed.

Preferred rollback is frontend/domain rollback, not destructive database rollback.

## 6. Android gate

Before Android release:
- [ ] Android application identifier approved
- [ ] Android build configuration added
- [ ] build succeeds
- [ ] install on representative device/emulator
- [ ] auth flows validated
- [ ] keyboard behavior validated
- [ ] safe areas/navigation validated
- [ ] all complex task renderers smoke-tested
- [ ] Mission interruption/background behavior validated
- [ ] same Supabase child/profile data visible as Web

## 7. iOS gate

Before iOS release:
- [ ] iOS bundle identifier approved
- [ ] iOS build configuration added
- [ ] build succeeds
- [ ] install on simulator/device
- [ ] auth flows validated
- [ ] keyboard behavior validated
- [ ] safe areas/navigation validated
- [ ] all complex task renderers smoke-tested
- [ ] Mission interruption/background behavior validated
- [ ] same Supabase child/profile data visible as Web

## 8. Release invariants

Never:
- replace the shared Supabase project with a platform-specific backend
- delete legacy progress during migration
- delete the legacy Railway service during initial Web cutover
- apply schema migrations silently from the frontend deploy
- promote a child to a higher mastery band using an arbitrary threshold that has not been approved
