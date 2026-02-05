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
    const isRecurring = !!formData.isRecurring;
    const { time, isRecurring: _ir, ...rest } = formData;
    const deadline = isRecurring ? null : (formData.deadline ? parseDateForDB(formData.deadline) : null);
    const recurrence_type = isRecurring ? 'weekly' : 'none';
    const recurrence_weekdays = isRecurring && Array.isArray(formData.recurrence_weekdays) ? formData.recurrence_weekdays : null;
    const toTime = (t: string) => (t && /^\d{1,2}:\d{2}/.test(t) ? (t.length >= 8 ? t.slice(0, 8) : `${t.replace(/^(\d{1,2}):(\d{2}).*/, '$1:$2')}:00`) : null);
    const start_time = isRecurring && formData.start_time ? toTime(String(formData.start_time)) : null;
    const end_time = isRecurring && formData.end_time ? toTime(String(formData.end_time)) : null;

    const taskData = {
      ...rest,
      deadline,
      recurrence_type,
      recurrence_weekdays,
      start_time,
      end_time,
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


