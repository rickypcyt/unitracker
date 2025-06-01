export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  priority?: number;
  tags?: string[];
  user_id?: string;
  activetask?: boolean;
  difficulty?: string;
  assignment?: string;
} 