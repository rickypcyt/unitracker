export interface Lap {
  id: string;
  user_id: string;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  duration: string;
  session_number: number;
  name: string;
  description?: string | null;
  tasks_completed: number;
  pomodoros_completed?: number;
  session_assignment?: string | null;
  focus_score?: number | null;
  productivity_rating?: number | null;
  type?: string;
  subject_id?: string | null;
  subject_name?: string | null;
  subject_color?: string | null;
}
