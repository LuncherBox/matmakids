export type Child = {
  id: string;
  display_name: string;
  birth_date: string | null;
  share_code: string | null;
  gobi_level: number;
  created_at?: string;
};

export type SessionSummary = {
  id: string;
  child_id: string;
  status: string;
  task_count: number;
  correct_first_try_count: number;
  mistake_count: number;
  child_points: number;
  gobi_points: number;
  winner: string | null;
  created_at: string;
  completed_at: string | null;
};

export type TaskTypeProgress = {
  child_id: string;
  task_type: string;
  training_status: 'new' | 'training' | 'learned';
  training_attempts: number;
  trained_at: string | null;
};
