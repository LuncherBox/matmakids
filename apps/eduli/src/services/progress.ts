import { supabase } from '../lib/supabase';
import type { TaskMechanicProgress } from '../types/tasks';

export async function getLearnedMechanics(childId: string): Promise<TaskMechanicProgress[]> {
  const { data, error } = await supabase
    .from('child_task_type_progress')
    .select('child_id, task_type, training_status, training_attempts, trained_at')
    .eq('child_id', childId)
    .eq('training_status', 'learned');

  if (error) throw error;
  return (data ?? []) as TaskMechanicProgress[];
}

export async function markMechanicLearned(childId: string, taskType: string) {
  const { error } = await supabase
    .from('child_task_type_progress')
    .upsert(
      {
        child_id: childId,
        task_type: taskType,
        training_status: 'learned',
        training_attempts: 1,
        trained_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'child_id,task_type' }
    );

  if (error) throw error;
}

export async function getMechanicProgress(childId: string): Promise<TaskMechanicProgress[]> {
  const { data, error } = await supabase
    .from('child_task_type_progress')
    .select('child_id, task_type, training_status, training_attempts, trained_at')
    .eq('child_id', childId);

  if (error) throw error;
  return (data ?? []) as TaskMechanicProgress[];
}
