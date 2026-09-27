-- Eduli universal frontend - child onboarding and avatar state.
-- Run in the existing Supabase project after review.

alter table public.children
  add column if not exists avatar_key text;

alter table public.children
  add column if not exists onboarding_stage text not null default 'intro';

alter table public.children
  drop constraint if exists children_onboarding_stage_check;

alter table public.children
  add constraint children_onboarding_stage_check
  check (onboarding_stage in ('intro','training','mission','completed'));

alter table public.children
  add column if not exists onboarding_completed boolean not null default false;

alter table public.children
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.children.avatar_key is
  'Technical key of the child avatar selected in Eduli.';

comment on column public.children.onboarding_completed is
  'True after the child completes the first-use child-mode onboarding.';

comment on column public.children.onboarding_completed_at is
  'Timestamp of first completed child-mode onboarding.';


comment on column public.children.onboarding_stage is
  'Durable first-use child-mode stage: intro, training, mission or completed.';
