export interface Workspace {
  id: string;
  name: string;
  icon?: string | null;
  description?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  is_default?: boolean;
  isAll?: boolean;
}
