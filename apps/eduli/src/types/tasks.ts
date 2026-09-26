export type Task = {
  id: string;
  name?: string;
  category: 'math' | 'logic' | 'coding' | 'memory';
  subcategory?: string;
  renderer: string;
  level?: number;
  age_min?: number;
  age_max?: number;
  prompt?: string;
  correct_answer: string | number;
  options?: Array<string | number>;
  content?: Record<string, any>;
  status?: string;
};

export type TaskMechanicProgress = {
  child_id: string;
  task_type: string;
  training_status: 'new' | 'training' | 'learned';
  training_attempts: number;
  trained_at: string | null;
};
