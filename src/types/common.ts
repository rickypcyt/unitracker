export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  completions: Record<string, boolean>; // key: "YYYY-MM-DD", value: completed
}
