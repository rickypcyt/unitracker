import { addTaskSuccess, updateTaskSuccess } from '@/store/slices/TaskSlice';
import { useDispatch, useSelector } from 'react-redux';

import { supabase } from '@/utils/supabaseClient';
import { useCallback } from 'react';

type SaveArgs = {
  formData: any;
  userId: string;
  initialTask?: any | null;
  activeWorkspaceId?: string | null;
  parseDateForDB: (d: string | null | undefined) => string | null;
};

export function useTaskSubmit() {
  const dispatch = useDispatch();
  const activeWorkspace = useSelector((state: any) => state.workspace.activeWorkspace);

  const saveTask = useCallback(async ({ formData, userId, initialTask, activeWorkspaceId, parseDateForDB }: SaveArgs) => {
    const taskData = {
      ...formData,
      deadline: formData.deadline ? parseDateForDB(formData.deadline) : null,
      user_id: userId,
      completed: initialTask?.completed || false,
      activetask: initialTask?.activetask || false,
      ...(initialTask ? {} : { workspace_id: activeWorkspaceId ?? activeWorkspace?.id ?? null }),
    };

    if (initialTask) {
      const { data, error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', initialTask.id)
        .select()
        .single();
      if (error) throw error;
      dispatch(updateTaskSuccess(data));
      return data;
    } else {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();
      if (error) throw error;
      dispatch(addTaskSuccess(data));
      return data;
    }
  }, [dispatch, activeWorkspace]);

  return { saveTask };
}


