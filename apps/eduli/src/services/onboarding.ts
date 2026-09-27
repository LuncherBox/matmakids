import { supabase } from '../lib/supabase';

export type OnboardingStage = 'intro' | 'training' | 'mission' | 'completed';

export type ChildOnboardingState = {
  stage: OnboardingStage;
  completed: boolean;
  progressionLevel: number | null;
  schemaReady: boolean;
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;

  return (
    error.code === '42703' ||
    /onboarding_stage|onboarding_completed|progression_level/i.test(
      error.message ?? ''
    )
  );
}

export async function getChildOnboardingState(
  childId: string
): Promise<ChildOnboardingState> {
  const { data, error } = await supabase
    .from('children')
    .select('onboarding_stage, onboarding_completed, progression_level')
    .eq('id', childId)
    .single();

  if (error) {
    if (isMissingColumnError(error)) {
      return {
        stage: 'completed',
        completed: true,
        progressionLevel: null,
        schemaReady: false
      };
    }

    throw error;
  }

  return {
    stage: (data.onboarding_stage ?? 'intro') as OnboardingStage,
    completed: Boolean(data.onboarding_completed),
    progressionLevel: data.progression_level ?? null,
    schemaReady: true
  };
}

export async function setChildOnboardingStage(
  childId: string,
  stage: OnboardingStage
) {
  const completed = stage === 'completed';

  const { error } = await supabase
    .from('children')
    .update({
      onboarding_stage: stage,
      onboarding_completed: completed,
      onboarding_completed_at: completed ? new Date().toISOString() : null
    })
    .eq('id', childId);

  if (error) throw error;
}

export async function setInitialProgressionLevel(
  childId: string,
  progressionLevel: number
) {
  const { error } = await supabase
    .from('children')
    .update({ progression_level: progressionLevel })
    .eq('id', childId);

  if (error) throw error;
}
