import { useAddTaskSuccess, useUpdateTaskSuccess, useWorkspace } from '@/store/appStore';

import { supabase } from '@/utils/supabaseClient';
import { useCallback } from 'react';

// Helper function to convert 12h AM/PM format to 24h format (HH:MM)
function to24Hour(time12: string): string {
  if (!time12) return '';
  
  // Remove seconds if present (e.g., "10:00:00" -> "10:00")
  const timeWithoutSeconds = time12.replace(/:\d{2}$/, '');
  
  // Try 12h format first
  const match = timeWithoutSeconds.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  
  if (match) {
    let hours = parseInt(match[1] ?? '0', 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    const period = (match[3] ?? '').toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  // Try 24h format
  const match24 = timeWithoutSeconds.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1] ?? '0', 10);
    const minutes = parseInt(match24[2] ?? '0', 10);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  return '';
}

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
    const { isRecurring: _ir, ...rest } = formData;
    
    // Handle deadline (always date only, no time)
    let deadline = null;
    if (isRecurring) {
      deadline = null; // Recurring tasks don't have deadline
    } else if (formData.deadline) {
      deadline = parseDateForDB(formData.deadline);
    }
    
    const recurrence_type = isRecurring ? 'weekly' : 'none';
    const recurrence_weekdays = isRecurring && Array.isArray(formData.recurrence_weekdays) ? formData.recurrence_weekdays : null;
    
    // Helper function to convert 12h AM/PM format to 24h format (HH:MM:SS)
    const toTime = (t: string | null | undefined) => {
      if (!t || t.trim() === '') return null;
      if (/^\d{1,2}:\d{2}/.test(t)) {
        return t.length >= 8 ? t.slice(0, 8) : `${t.replace(/^(\d{1,2}):(\d{2}).*/, '$1:$2')}:00`;
      }
      return null;
    };
    
    // Helper function to convert 12h AM/PM format to 24h format (HH:MM:SS)
    function to24Hour(time12: string): string {
      if (!time12) return '';
      
      // Remove seconds if present (e.g., "10:00:00" -> "10:00")
      const timeWithoutSeconds = time12.replace(/:\d{2}$/, '');
      
      // Try 12h format first
      const match = timeWithoutSeconds.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      
      if (match) {
        let hours = parseInt(match[1] ?? '0', 10);
        const minutes = parseInt(match[2] ?? '0', 10);
        const period = (match[3] ?? '').toUpperCase();
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      
      // Try 24h format
      const match24 = timeWithoutSeconds.match(/^(\d{1,2}):(\d{2})$/);
      if (match24) {
        const hours = parseInt(match24[1] ?? '0', 10);
        const minutes = parseInt(match24[2] ?? '0', 10);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      
      return '';
    }
    
    // Handle time fields
    let start_time = null;
    let end_time = null;
    
    if (isRecurring) {
      // For recurring tasks, use the dedicated time fields
      start_time = toTime(formData.start_time);
      end_time = toTime(formData.end_time);
    } else {
      // For normal tasks, always use start_time and end_time from form
      if (formData.start_time && formData.start_time.trim()) {
        start_time = to24Hour(formData.start_time) + ':00';
      }
      if (formData.end_time && formData.end_time.trim()) {
        end_time = to24Hour(formData.end_time) + ':00';
      }
    }
    
    // For normal tasks, ensure deadline is date-only (no time component)
    if (deadline && !isRecurring) {
      // Extract just the date part, removing any time component
      const dateMatch = deadline.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        deadline = `${dateMatch[1]}T00:00:00`; // Store as midnight UTC
      }
    }

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

    console.log('DEBUG: Task data being saved:', {
      deadline,
      start_time,
      end_time,
      isRecurring,
      hasStartTime: !!formData.start_time,
      hasEndTime: !!formData.end_time,
      originalFormDataStartTime: formData.start_time,
      originalFormDataEndTime: formData.end_time,
      formDataKeys: Object.keys(formData)
    });

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


