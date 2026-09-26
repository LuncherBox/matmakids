import { supabase } from '../lib/supabase';
import type { Child } from '../types/models';

const CHILD_FIELDS = 'id, display_name, birth_date, share_code, gobi_level, created_at';

export async function listChildren(): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select(CHILD_FIELDS)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Child[];
}

export async function getChild(childId: string): Promise<Child> {
  const { data, error } = await supabase
    .from('children')
    .select(CHILD_FIELDS)
    .eq('id', childId)
    .single();

  if (error) throw error;
  return data as Child;
}
