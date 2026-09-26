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

export async function createChild(displayName: string, birthDate: string): Promise<Child> {
  const { data, error } = await supabase.rpc('create_child_profile', {
    p_display_name: displayName,
    p_birth_date: birthDate
  });

  if (error) throw error;

  const child = Array.isArray(data) ? data[0] : data;
  return child as Child;
}

export async function joinChildByCode(shareCode: string): Promise<Child> {
  const { data, error } = await supabase.rpc('join_child_by_code', {
    p_share_code: shareCode
  });

  if (error) throw error;

  const child = Array.isArray(data) ? data[0] : data;
  return child as Child;
}

export async function updateChildProfile(
  childId: string,
  displayName: string,
  birthDate: string
): Promise<Child> {
  const { data, error } = await supabase
    .from('children')
    .update({
      display_name: displayName,
      birth_date: birthDate
    })
    .eq('id', childId)
    .select(CHILD_FIELDS)
    .single();

  if (error) throw error;
  return data as Child;
}
