import { useAddTaskSuccess, useUpdateTaskSuccess, useWorkspace } from '@/store/appStore';

import { supabase } from '@/utils/supabaseClient';
import { useCallback } from 'react';

// Helper function to convert 12h AM/PM format or ISO timestamp to 24h format (HH:MM)
function to24Hour(time12: string): string {
  if (!time12) return '';
  
  let timeToProcess = time12;
  
  // Handle ISO date format: '2026-02-09T10:00:00+00:00'
  if (time12.includes('T')) {
    const timePart = time12.split('T')[1]; // '10:00:00+00:00'
    if (timePart) {
      // Remove timezone info if present (handles +00:00 format)
      const cleanTimePart = timePart.split('+')[0]?.split('-')[0]?.split('Z')[0];
      if (cleanTimePart) {
        timeToProcess = cleanTimePart;
      }
    }
  }
  // Handle timestamptz format: '2026-02-09 10:00:00+00'
  else if (time12.includes(' ')) {
    const timePart = time12.split(' ')[1]; // '10:00:00+00'
    if (timePart) {
      // Remove timezone info if present
      const cleanTimePart = timePart.split('+')[0]?.split('-')[0]?.split('Z')[0];
      if (cleanTimePart) {
        timeToProcess = cleanTimePart;
      }
    }
  }
  
  // Remove seconds if present (e.g., "10:00:00" -> "10:00")
  // This regex only removes :SS where SS are digits, not :SS AM/PM
  const timeWithoutSeconds = timeToProcess.replace(/:\d{2}(?=\s|$)/, '');
  
  // Check if it's already in 24h format (HH:MM)
  const is24hFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeWithoutSeconds);
  if (is24hFormat) {
    return timeWithoutSeconds;
  }
  
  // Try 12h format
  const match = timeWithoutSeconds.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  
  if (match) {
    let hours = parseInt(match[1] ?? '0', 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    const period = (match[3] ?? '').toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
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
    
    // Handle time fields - convert to timestamptz format
    let start_at = null;
    let end_at = null;
    
    if (isRecurring) {
      // For recurring tasks, convert time to timestamptz using today's date
      if (formData.start_at && formData.start_at.trim()) {
        const time24 = to24Hour(formData.start_at);
        if (time24) {
          // Create timestamp for today with the specified time in UTC
          const today = new Date();
          const timeParts = time24.split(':');
          const hours = timeParts[0] || '0';
          const minutes = timeParts[1] || '0';
          
          // Create UTC date and format as timestamptz
          const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 
                                          parseInt(hours), parseInt(minutes), 0, 0));
          start_at = utcDate.toISOString().replace('T', ' ').replace('Z', '+00');
        }
      }
      if (formData.end_at && formData.end_at.trim()) {
        const time24 = to24Hour(formData.end_at);
        if (time24) {
          // Create timestamp for today with the specified time in UTC
          const today = new Date();
          const timeParts = time24.split(':');
          const hours = timeParts[0] || '0';
          const minutes = timeParts[1] || '0';
          
          // Create UTC date and format as timestamptz
          const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 
                                          parseInt(hours), parseInt(minutes), 0, 0));
          end_at = utcDate.toISOString().replace('T', ' ').replace('Z', '+00');
        }
      }
    } else {
      // For normal tasks, convert time to timestamptz using deadline date or today
      let baseDate = new Date();
      if (formData.deadline) {
        baseDate = new Date(formData.deadline);
      }
      
      if (formData.start_at && formData.start_at.trim()) {
        const time24 = to24Hour(formData.start_at);
        if (time24) {
          const timeParts = time24.split(':');
          const hours = timeParts[0] || '0';
          const minutes = timeParts[1] || '0';
          
          // Create UTC date and format as timestamptz
          const utcDate = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 
                                          parseInt(hours), parseInt(minutes), 0, 0));
          start_at = utcDate.toISOString().replace('T', ' ').replace('Z', '+00');
        }
      }
      if (formData.end_at && formData.end_at.trim()) {
        const time24 = to24Hour(formData.end_at);
        if (time24) {
          const timeParts = time24.split(':');
          const hours = timeParts[0] || '0';
          const minutes = timeParts[1] || '0';
          
          // Create UTC date and format as timestamptz
          const utcDate = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 
                                          parseInt(hours), parseInt(minutes), 0, 0));
          end_at = utcDate.toISOString().replace('T', ' ').replace('Z', '+00');
        }
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

    // Explicitly exclude the 'time' field from rest
    const { time: _, ...restWithoutTime } = rest;
    
    const taskData = {
      ...restWithoutTime,  // Use restWithoutTime instead of rest to exclude the time field
      deadline,
      recurrence_type,
      recurrence_weekdays,
      start_at,
      end_at,
      user_id: userId,
      completed: initialTask?.completed || false,
      activetask: initialTask?.activetask || false,
      ...(initialTask ? {} : { workspace_id: activeWorkspaceId ?? activeWorkspace?.id ?? null }),
    };

    console.log('DEBUG: Task data being saved:', {
      deadline,
      start_at,
      end_at,
      isRecurring,
      hasStartTime: !!formData.start_at,
      hasEndTime: !!formData.end_at,
      originalFormDataStartTime: formData.start_at,
      originalFormDataEndTime: formData.end_at,
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


