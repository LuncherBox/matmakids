# Native build readiness

Date: 2026-10-01

Current app:
- Expo SDK 57
- React Native
- Expo Router
- shared Supabase backend
- portrait orientation
- custom URL scheme: `eduli`

## What is already validated

CI now exports production bundles for:
- Web
- Android
- iOS

This validates:
- TypeScript compilation
- unit tests
- Metro bundling
- cross-platform module resolution
- static asset resolution used by the Expo project

It does NOT yet validate:
- Android native binary build
- iOS native binary build
- app signing
- installation
- native keyboard/safe-area behavior
- store submission requirements

## Current native configuration gaps

`apps/eduli/app.json` does not yet define:
- `android.package`
- `ios.bundleIdentifier`

There is no committed `eas.json`.

Do not invent production identifiers without product/account approval.

## Authentication note

Current Google OAuth UI is intentionally Web-only:
- login/register render Google action only when `Platform.OS === 'web'`

Native email/password auth can still be validated independently.

Before native release decide one of:
1. email/password only for first native MVP, or
2. implement native Google OAuth with appropriate redirect/deep-link configuration

Password reset must also be tested through the `eduli` scheme / native linking path if enabled for native users.

## Android next steps

- approve Android package identifier
- add `android.package` to app config
- choose EAS Build or local Gradle build path
- configure signing/keystore
- build installable artifact
- install on emulator/device
- test:
  - login
  - session persistence
  - child data
  - keyboard
  - back navigation
  - Mission interruption/background/resume
  - complex task grids
  - memory timing
  - safe-area/system bars

## iOS next steps

- approve iOS bundle identifier
- add `ios.bundleIdentifier` to app config
- choose EAS Build or local Xcode build path
- configure Apple signing
- build simulator/device artifact
- install and run
- test:
  - login
  - session persistence
  - child data
  - keyboard
  - navigation gestures
  - Mission interruption/background/resume
  - complex task grids
  - memory timing
  - safe areas

## Shared data invariant

A Web parent account must show the same:
- child profiles
- progress
- sessions
- results

after signing into the native app.

Do not create platform-specific user/profile/progress stores.

## Release status terminology

Use these labels consistently:

- **bundle validated** - `expo export` succeeds for the platform
- **build validated** - installable native binary builds successfully
- **device validated** - binary has been installed and smoke-tested on a real device/emulator/simulator
- **release ready** - signing, auth, data, device flows and release checklist all pass
