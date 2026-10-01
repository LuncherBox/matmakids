# Eduli responsive audit

Date: 2026-10-01

Scope:
- Expo / React Native / React Native Web app in `apps/eduli`
- compact phones: 320-360 px
- regular phones and Web
- task renderer layouts
- parent mode
- child mode
- onboarding
- authentication and child-management forms

## Shared rules

Implemented:
- compact-phone breakpoint at 360 px
- compact horizontal screen padding: 16 px
- regular horizontal screen padding: 24 px
- responsive heading sizing on screens with large display titles
- complex task grids use calculated cell sizes instead of fixed widths
- long row labels can shrink/wrap without pushing trailing values outside cards

## Task renderers

Validated and adjusted:
- Sudoku grid
- visual search grid
- command/path grid
- memory location grid
- color grid copy
- binary grid copy

Complex grids now fit the available task-card width on narrow phones while retaining preferred cell sizes when space allows.

## Child mode screens

Reviewed:
- child home
- handoff / "Przekaż telefon dziecku"
- child onboarding intro
- onboarding training
- onboarding mission
- Mission
- Practice category list and task flow
- child results

Changes:
- child home metrics wrap on compact phones
- child results metrics wrap on compact phones
- large child-facing headings reduce only on compact phones
- long mechanic labels have flexible text columns
- onboarding cards use compact horizontal padding

## Parent mode screens

Reviewed:
- parent home / children list
- child profile
- edit child
- create child
- join child by code
- parent statistics
- educational report

Changes:
- parent/public home uses compact padding
- public hero heading scales down on compact phones
- Gobi marketing card stacks vertically on compact phones
- child profile heading scales down
- statistics and report rows reserve space for trailing percentages/scores
- report empty-data rendering no longer assumes a strongest category exists

## Authentication screens

Reviewed:
- login
- register
- reset password
- new password

No structural responsive changes required:
- forms are single-column
- cards already use `width: 100%` with a desktop `maxWidth`
- controls do not rely on fixed horizontal dimensions

## Known remaining validation

Code-level responsive audit is complete.

Still required before mobile release:
- manual device/simulator smoke test on representative Android sizes
- manual iOS simulator/device smoke test
- keyboard-open behavior on auth/forms
- safe-area behavior on devices with notches/home indicators
- landscape mode is not a release requirement for the MVP unless explicitly added later
