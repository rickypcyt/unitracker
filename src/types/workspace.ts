export interface Workspace {
  id: string | number;
  name: string;
  icon?: string | null;
  description?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  is_default?: boolean;
}
