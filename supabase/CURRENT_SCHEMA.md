# Current Supabase model used by Eduli

Updated: 2026-09-27.

This document describes the database shape used by the current production frontend and the new Expo frontend. It supersedes the original one-parent prototype documented in the older SQL files.

## Identity

### auth.users
Supabase Auth remains the source of identity.

### parents
- id -> auth.users.id
- email
- created_at

A trigger mirrors new Auth users into this table.

## Shared child profiles

### children
The child is independent of any one parent.

Fields used by the application:
- id
- display_name
- birth_date - source of truth for age
- share_code - random code used to connect another adult
- gobi_level - current Gobi difficulty
- created_at

Legacy compatibility fields may still exist:
- age
- birth_year

Do not use legacy age fields for eligibility or UI. Always calculate age from birth_date.

### parent_children
Many-to-many link between adult accounts and child profiles.

- parent_id -> parents.id
- child_id -> children.id
- created_at
- primary key: parent_id + child_id

All authorization for child-owned data is based on this link.

Child creation and joining are controlled through SECURITY DEFINER RPC functions rather than unrestricted direct browser inserts.

RPCs currently used:
- create_child_profile(p_display_name, p_birth_date)
- join_child_by_code(p_share_code)
- generate_child_share_code()

## Learning sessions

### sessions
Fields used by the application:
- id
- child_id
- started_at
- completed_at
- status: started / completed / abandoned
- task_count
- correct_first_try_count
- mistake_count
- child_points
- gobi_points
- winner: child / gobi / draw / null
- mode
- category
- gobi_level

### session_answers
Fields used by the application:
- id
- session_id
- task_id
- task_type
- category
- attempts
- correct_first_try
- used_hint
- used_guided_help
- points_child
- points_gobi
- created_at

## Learning progress

### child_task_type_progress
- child_id
- task_type
- training_status: new / training / learned
- training_attempts
- trained_at
- created_at
- updated_at
- primary key: child_id + task_type

This table currently records whether a mechanic has been learned. Future progression work must extend the model with mastery/difficulty per mechanic instead of replacing this history.

## RLS model

RLS is enabled on application tables.

Core rule:
- an authenticated adult can access a child's data only when a matching parent_children row exists for auth.uid() and that child

This rule is applied to:
- children
- sessions
- session_answers
- child_task_type_progress

parents is limited to the authenticated adult's own row.

Direct creation/linking of child profiles is intentionally restricted; create/join RPCs perform those operations.

## Cross-platform rule

The same Supabase project is the durable source of truth for:
- current legacy web frontend
- Expo web frontend
- future Android app
- future iOS app

Do not create platform-specific account, child, points, mission or progress tables.
