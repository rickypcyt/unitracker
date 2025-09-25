export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  is_default?: boolean;
}
