import { useAddTaskSuccess, useAppStore, useUpdateTaskSuccess, useWorkspace } from '@/store/appStore';

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
  const updateTaskSuccess = useUpdateTaskSuccess();
  const addTaskSuccess = useAddTaskSuccess();
  const { currentWorkspace: activeWorkspace } = useWorkspace();

  const saveTask = useCallback(async ({ formData, userId, initialTask, activeWorkspaceId, parseDateForDB }: SaveArgs) => {
    // Exclude 'time' field since it's not a database column - time is combined into deadline
    const { time, ...formDataWithoutTime } = formData;
    const taskData = {
      ...formDataWithoutTime,
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
      updateTaskSuccess(data);
      return data;
    } else {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();
      if (error) throw error;
      addTaskSuccess(data);
      return data;
    }
  }, [updateTaskSuccess, addTaskSuccess, activeWorkspace]);

  return { saveTask };
}


