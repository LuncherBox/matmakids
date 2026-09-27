# Supabase setup

Eduli uses one shared Supabase backend for web, future Android and future iOS.

## Current source of truth

Read:
- `CURRENT_SCHEMA.md` - current production data model and RLS assumptions

The original `schema.sql` and `rls.sql` files were created for the earlier one-parent prototype and must not be treated as the current production schema.

## Authentication

Current auth methods:
- email + password
- Google OAuth

Email confirmation is enabled.

## Frontend configuration

Browser/native clients use only:
- Project URL
- publishable / anon key

Never put a service-role key in GitHub or frontend code.

The current legacy frontend and the new Expo frontend must point to the same Supabase project.
