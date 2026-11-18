import 'react-datepicker/dist/react-datepicker.css';
import '@/pages/calendar/datepicker-overrides.css';

import { Calendar, Sparkles, Wand2 } from 'lucide-react';
import { parseDateForDB, to12Hour, to24Hour } from '@/utils/timeUtils';
import { useEffect, useRef, useState } from 'react';

import AutocompleteInput from '@/modals/shared/AutocompleteInput';
import BaseModal from '@/modals/shared/BaseModal';
import MarkdownWysiwyg from '@/components/editor/MarkdownWysiwyg';
import { useAuth } from '@/hooks/auth/useAuth';
import { useFormState } from '@/hooks/common/useFormState';
import { useTaskSubmit } from '@/hooks/tasks/useTaskSubmit';
import { useTasks } from '@/store/appStore';
import { useWorkspace } from '@/store/appStore';

type TaskFormProps = {
  initialAssignment?: string | null;
  initialTask?: any | null;
  initialDeadline?: string | Date | null;
  focusOnDate?: boolean;
  onClose: () => void;
  onTaskCreated?: (id: string) => void;
  onSwitchToAI?: () => void;
};
const DIFFICULTY_OPTIONS = [{
  value: 'easy',
  label: 'Easy',
  activeClass: 'bg-[#00FF41]/15 text-[#00FF41]'
}, {
  value: 'medium',
  label: 'Medium',
  activeClass: 'bg-[#00BFFF]/15 text-[#00BFFF]'
}, {
  value: 'hard',
  label: 'Hard',
  activeClass: 'bg-[#FF003C]/15 text-[#FF003C]'
}] as const;
const TaskForm = ({
  initialAssignment = null,
  initialTask = null,
  initialDeadline = null,
  focusOnDate = false,
  onClose,
  onTaskCreated,
  onSwitchToAI
}: TaskFormProps) => {
  const {
    saveTask
  } = useTaskSubmit();
  const workspace = useWorkspace();
  const {
    user
  } = useAuth();
  const {
    tasks
  } = useTasks();
  const {
    workspaces,
    currentWorkspace: activeWorkspace
  } = workspace;
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const hiddenDeadlineDateTimeRef = useRef<HTMLInputElement>(null);

  // Local workspace state for this task only
  const [selectedWorkspace, setSelectedWorkspace] = useState(() => {
    // If current workspace is "All", select the first available workspace instead
    if (activeWorkspace?.id === 'all' && workspaces && workspaces.length > 0) {
      return workspaces[0];
    }
    return activeWorkspace;
  });

  // Status state
  const [selectedStatus] = useState(initialTask?.status || 'todo');
  const typedUser = user as any;
  const getInitialRecurrence = () => {
    if (initialTask?.recurrence_type === 'weekly' && Array.isArray(initialTask?.recurrence_weekdays)) return initialTask.recurrence_weekdays;

    // For new recurring tasks, pre-select the current day
    if (!initialTask && initialDeadline) {
      const deadlineDate = new Date(initialDeadline);
      const dayOfWeek = deadlineDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      return [dayOfWeek];
    }
    return [];
  };

  // Form State
  const initialFormState = {
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    deadline: getInitialDeadline(),
    start_at: getInitialStartTimeForForm(),
    end_at: getInitialEndTimeForForm(),
    difficulty: initialTask?.difficulty || 'medium',
    assignment: initialTask?.assignment || initialAssignment || '',
    isRecurring: !!(initialTask?.recurrence_type === 'weekly'),
    recurrence_weekdays: getInitialRecurrence()
  };
  const validationRules = {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    assignment: {
      required: true
    },
    difficulty: {
      required: true
    },
    description: {
      maxLength: 500
    },
    deadline: {
      required: false,
      validate: validateDeadline
    },
    start_at: {
      required: false,
      validate: validateTime
    },
    end_at: {
      required: false,
      validate: validateTime
    }
  };
  const {
    formData,
    errors,
    handleChange,
    validateForm,
    hasInteracted
  } = useFormState(initialFormState as any, validationRules as any) as any;
  const [recurrenceError, setRecurrenceError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isEditingExistingTask = Boolean(initialTask);
  // Force hasSubmitted to be false initially (debug)
  useEffect(() => {
    if (hasSubmitted) {
      console.warn('hasSubmitted was true initially, forcing to false');
      setHasSubmitted(false);
    }
  }, []);

  // Only show errors after user has interacted with form or attempted to submit
  const displayErrors = hasInteracted || hasSubmitted ? errors : {};

  // Debug: Log the states to understand what's happening

  // Check for AI-generated task data
  useEffect(() => {
    const aiGeneratedTask = sessionStorage.getItem('aiGeneratedTask');
    if (aiGeneratedTask) {
      try {
        const taskData = JSON.parse(aiGeneratedTask);
        Object.entries(taskData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            handleChange(key, value);
          }
        });
        sessionStorage.removeItem('aiGeneratedTask');
      } catch (error) {
        console.error('Error parsing AI generated task:', error);
      }
    }
  }, []);

  // Effects
  useEffect(() => {
    if (initialAssignment) {
      handleChange('assignment', initialAssignment);
    }
  }, [initialAssignment, handleChange]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true); // Mark that user has attempted to submit

    if (formData.isRecurring) {
      setRecurrenceError(null);
      if (!formData.recurrence_weekdays?.length) {
        setRecurrenceError('Select at least one day');
        return;
      }
      if (!formData.start_at || !formData.start_at.trim()) {
        setRecurrenceError('Start time is required');
        return;
      }
      if (!formData.end_at || !formData.end_at.trim()) {
        setRecurrenceError('End time is required');
        return;
      }
      const start24 = to24Hour(formData.start_at);
      const end24 = to24Hour(formData.end_at);
      if (!start24) {
        setRecurrenceError('Invalid start time format');
        return;
      }
      if (!end24) {
        setRecurrenceError('Invalid end time format');
        return;
      }
      const [sh, sm] = start24.split(':').map(Number);
      const [eh, em] = end24.split(':').map(Number);
      if ((eh ?? 0) * 60 + (em ?? 0) <= (sh ?? 0) * 60 + (sm ?? 0)) {
        setRecurrenceError('End time must be after start time');
        return;
      }
    } else {
      if (!validateForm()) {
        return;
      }
    }
    try {
      if (!typedUser) return;

      // Preserve provided times; convert later during saveTask
      const updatedFormData = {
        ...formData
      };
      const saved = await saveTask({
        formData: {
          ...updatedFormData,
          status: selectedStatus
        },
        userId: typedUser.id,
        initialTask,
        activeWorkspaceId: selectedWorkspace?.id ?? null,
        parseDateForDB: parseDateForDB
      });
      if (!initialTask && saved?.id && onTaskCreated) {
        onTaskCreated(saved.id);
      }

      // Clear calendar hour after successful save
      sessionStorage.removeItem('calendarTaskHour');
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };
  const handleCancel = () => {
    // Blur any active editor to prevent focus issues
    if (document.activeElement instanceof HTMLElement && 'blur' in document.activeElement) {
      document.activeElement.blur();
    }

    // Clear calendar hour when closing
    sessionStorage.removeItem('calendarTaskHour');
    onClose();
  };

  // Helper Functions
  function getInitialDeadline(): string {
    if (initialDeadline) {
      if (typeof initialDeadline === 'string') {
        // If it's already a string, check if it's ISO format (contains 'T')
        // If it is, return date part only. If not (DD/MM/YYYY), return as is
        if (initialDeadline.includes('T')) {
          return initialDeadline.split('T')[0]!; // Return only date part for display
        }
        return initialDeadline;
      } else {
        // If it's a Date object, convert to date string
        const year = initialDeadline.getFullYear();
        const month = String(initialDeadline.getMonth() + 1).padStart(2, '0');
        const day = String(initialDeadline.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
      }
    }
    if (initialTask?.deadline) {
      // Extract date part from ISO string for display
      const taskDeadline = new Date(initialTask.deadline);
      const year = taskDeadline.getFullYear();
      const month = String(taskDeadline.getMonth() + 1).padStart(2, '0');
      const day = String(taskDeadline.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    // Default to today for new tasks
    const today = new Date();
    const tDay = String(today.getDate()).padStart(2, '0');
    const tMonth = String(today.getMonth() + 1).padStart(2, '0');
    const tYear = today.getFullYear();
    return `${tDay}/${tMonth}/${tYear}`;
  }
  function normalizeTaskTime(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    let timePortion = trimmed;
    const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}T(.+)/);
    if (isoMatch?.[1]) {
      timePortion = isoMatch[1];
    } else {
      const spaceMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}\s(.+)/);
      if (spaceMatch?.[1]) {
        timePortion = spaceMatch[1];
      }
    }

    // Remove timezone suffixes (+00, +00:00, -05, Z, etc.)
    timePortion = timePortion.replace(/[zZ]$/, '').split('+')[0]!.split('-')[0]!;
    const normalized = to24Hour(timePortion);
    if (normalized) {
      return `${normalized}:00`;
    }
    const parts = timePortion.split(':');
    if (parts.length >= 2) {
      const hours = parts[0];
      const minutes = parts[1];
      if (!Number.isNaN(Number(hours)) && !Number.isNaN(Number(minutes))) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      }
    }
    return null;
  }
  function getInitialStartTimeForForm(): string | null {
    if (initialTask?.start_at) {
      return normalizeTaskTime(initialTask.start_at);
    }

    // Check if there's a calendar hour set
    const calendarHour = sessionStorage.getItem('calendarTaskHour');
    if (calendarHour && !initialTask) {
      const hour = parseInt(calendarHour);
      return `${hour.toString().padStart(2, '0')}:00:00`;
    }

    // If there's no deadline, return null for new tasks
    if (!getInitialDeadline()) {
      return null;
    }
    return null;
  }
  function getInitialEndTimeForForm(): string | null {
    if (initialTask?.end_at) {
      return normalizeTaskTime(initialTask.end_at);
    }

    // Check if there's a calendar hour set
    const calendarHour = sessionStorage.getItem('calendarTaskHour');
    if (calendarHour && !initialTask) {
      const hour = parseInt(calendarHour) + 1; // End time 1 hour later
      return `${hour.toString().padStart(2, '0')}:00:00`;
    }

    // If there's no deadline, return null for new tasks
    if (!getInitialDeadline()) {
      return null;
    }
    return null;
  }
  function validateDeadline(value: string): true | string {
    if (!value) return true;

    // Validate DD/MM/YYYY format
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(dateRegex);
    if (!match) {
      return 'Please enter a valid date in DD/MM/YYYY format';
    }
    const [, day, month, year] = match;
    const date = new Date(`${year}-${month}-${day}`);
    return isNaN(date.getTime()) ? 'Please enter a valid date in DD/MM/YYYY format' : true;
  }
  function validateTime(value: string): true | string {
    if (!value) return true;

    // Validate 12h AM/PM format (HH:MM AM/PM) or 24h format (HH:MM)
    const time12Regex = /^(\d{1,2}):([0-5][0-9])\s*(AM|PM)$/i;
    const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return time12Regex.test(value) || time24Regex.test(value) ? true : 'Please enter a valid time (e.g., 10:30 AM or 14:30)';
  }

  // Computed values
  const uniqueAssignments = [...new Set(tasks.map((task: any) => task.assignment || 'No Subject').filter(a => a && a !== 'No Subject'))].sort();
  const selectableWorkspaces = (workspaces || []).filter((w: any) => w.id !== 'all');
  const modalTitle = initialTask ? 'Edit Task' : initialAssignment ? `Add Task for ${initialAssignment}` : 'Add Task';
  // Render Components
  const renderTabSelector = () => <div className="w-full flex justify-center mb-4">
      <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-md text-base font-medium bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm">
          <Wand2 size={16} />
          Manual
        </span>
        <button type="button" className="flex items-center gap-1.5 px-4 py-2 rounded-md text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" onClick={() => onSwitchToAI?.()}>
          <Sparkles size={16} />
          Auto (AI)
        </button>
      </div>
    </div>;
  const renderDifficultySelector = () => {
    return <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Difficulty</label>
        <div className="flex rounded-lg border-2 border-[var(--border-primary)] overflow-hidden divide-x divide-[var(--border-primary)]">
          {DIFFICULTY_OPTIONS.map(option => {
            const isSelected = option.value === formData.difficulty;
            return <button key={option.value} type="button" onClick={() => handleChange('difficulty', option.value)} className={`flex-1 px-3 py-2 text-sm font-medium transition-all ${isSelected ? `${option.activeClass} font-semibold` : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
              {option.label}
            </button>;
          })}
        </div>
        {displayErrors.difficulty && <p className="mt-1 text-sm text-red-500">{displayErrors.difficulty}</p>}
      </div>;
  };
  const clearDeadline = () => {
    handleChange('deadline', '');
    handleChange('start_at', null);
    handleChange('end_at', null);
    setDisplayStartTime('');
    setDisplayEndTime('');
  };
  // Convert stored DD/MM/YYYY (or ISO) deadline to YYYY-MM-DD for <input type="date">
  const deadlineToIso = (): string => {
    const d = formData.deadline;
    if (!d) return '';
    if (d.includes('/')) {
      const [day, month, year] = d.split('/');
      return `${year}-${month}-${day}`;
    }
    const match = d.match(/^(\d{4}-\d{2}-\d{2})/);
    return match?.[1] ?? '';
  };
  // Display deadline as DD/MM/YYYY (or "None") regardless of stored format
  const deadlineDisplay = (): string => {
    const d = formData.deadline;
    if (!d) return 'None';
    if (d.includes('/')) return d;
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : d;
  };
  // deadline date+time for <input type="datetime-local">
  const deadlineToLocal = (): string => {
    const iso = deadlineToIso();
    if (!iso) return '';
    const time = (formData.end_at || '12:00').slice(0, 5);
    return `${iso}T${time}`;
  };
  // Display deadline as "DD/MM/YYYY at h:mm AM/PM" (or empty → "None" placeholder)
  const deadlineDisplayFull = (): string => {
    const d = formData.deadline;
    if (!d) return '';
    const time = formData.end_at ? to12Hour(formData.end_at.slice(0, 5)) : '';
    const dateStr = deadlineDisplay();
    return time ? `${dateStr} at ${time}` : dateStr;
  };
  const openDeadlinePicker = () => {
    try { hiddenDeadlineDateTimeRef.current?.showPicker(); } catch { /* unsupported or already open */ }
  };
  const renderDeadlinePicker = () => <div className="w-full">
      <div className="relative flex items-center w-full">
        <input id="deadline" type="text" readOnly value={deadlineDisplayFull()} placeholder="None" onClick={openDeadlinePicker} className={`w-full pl-11 pr-3 py-2 bg-[var(--bg-primary)] border-2 ${displayErrors.deadline ? 'border-red-500' : 'border-[var(--border-primary)]'} rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:border-[var(--accent-primary)] transition-all leading-6`} />
        <input ref={hiddenDeadlineDateTimeRef} type="datetime-local" tabIndex={-1} aria-hidden="true" value={deadlineToLocal()} onChange={e => {
        const v = e.target.value; // YYYY-MM-DDTHH:MM
        if (v) {
          const [datePart, timePart] = v.split('T');
          const [year, month, day] = (datePart || '').split('-');
          if (year && month && day) {
            handleChange('deadline', `${day}/${month}/${year}`);
          }
          if (timePart) {
            handleChange('end_at', `${timePart}:00`);
          }
        } else {
          clearDeadline();
        }
      }} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
        <button type="button" onClick={openDeadlinePicker} className="absolute left-2 top-0 bottom-0 w-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer" tabIndex={-1} title="Pick date">
          <Calendar size={20} />
        </button>
      </div>
      {displayErrors.deadline && <p className="mt-1 text-base text-red-500">{displayErrors.deadline}</p>}
    </div>;
  const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 ... Sun=0 (JS getDay())

  const renderRecurrenceToggle = () => <label className="flex items-center gap-3 cursor-pointer group sm:self-end sm:mb-2.5">
      <div className="relative">
        <input type="checkbox" checked={formData.isRecurring} onChange={e => {
        setRecurrenceError(null);
        handleChange('isRecurring', e.target.checked);
      }} className="opacity-0 absolute h-6 w-6" />
        <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors duration-200
          ${formData.isRecurring ? 'bg-transparent border-[var(--accent-primary)]' : 'bg-transparent border-[var(--border-primary)]'}`}>
          {formData.isRecurring && <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>}
        </div>
      </div>
      <span className="text-[var(--text-primary)] font-medium text-base whitespace-nowrap">Repeat weekly</span>
    </label>;

  const renderRecurrenceSection = () => <div>
      {formData.isRecurring && <div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">Repeat on:</p>
          <div className="flex flex-wrap gap-1">
            {WEEKDAY_VALUES.map((d, i) => <label key={d} className={`inline-flex items-center justify-center w-12 h-12 rounded-lg cursor-pointer transition-all text-base font-medium ${(formData.recurrence_weekdays || []).includes(d) ? 'border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold bg-transparent' : 'border-2 border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}>
                <input type="checkbox" className="sr-only" checked={(formData.recurrence_weekdays || []).includes(d)} onChange={e => {
            setRecurrenceError(null);
            const current = (formData.recurrence_weekdays || []) as number[];
            const next = e.target.checked ? [...current, d].sort((a, b) => a - b) : current.filter(x => x !== d);
            handleChange('recurrence_weekdays', next);
          }} />
                {WEEKDAY_LABELS[i]}
              </label>)}
          </div>
          {displayErrors.recurrence_weekdays && <p className="mt-1 text-base text-red-500">{displayErrors.recurrence_weekdays}</p>}
          {recurrenceError && <p className="mt-2 text-base text-red-500">{recurrenceError}</p>}
        </div>}
    </div>;

  // Local state for time inputs (12h format for display)
  const [displayStartTime, setDisplayStartTime] = useState(() => {
    if (initialFormState.start_at) {
      return to12Hour(initialFormState.start_at);
    }
    return '';
  });
  const [displayEndTime, setDisplayEndTime] = useState(() => {
    if (initialFormState.end_at) {
      return to12Hour(initialFormState.end_at);
    }
    return '';
  });

  // Flag to prevent useEffect from overriding manual adjustments
  const [isManualTimeUpdate, setIsManualTimeUpdate] = useState(false);

  // Sync display times when formData changes externally (but not during manual updates)
  useEffect(() => {
    if (formData.start_at && !isManualTimeUpdate) {
      setDisplayStartTime(to12Hour(formData.start_at));
    } else if (!formData.start_at && !isManualTimeUpdate) {
      setDisplayStartTime('');
    }
  }, [formData.start_at, isManualTimeUpdate]);
  useEffect(() => {
    if (formData.end_at && !isManualTimeUpdate) {
      setDisplayEndTime(to12Hour(formData.end_at));
    } else if (!formData.end_at && !isManualTimeUpdate) {
      setDisplayEndTime('');
    }
  }, [formData.end_at, isManualTimeUpdate]);

  // Update times when deadline changes
  useEffect(() => {
    if (isEditingExistingTask) return;
    if (formData.deadline) {
      // If deadline is set, ensure times are set
      if (!formData.start_at) {
        handleChange('start_at', '12:00:00');
        setDisplayStartTime('12:00 PM');
      }
      if (!formData.end_at) {
        handleChange('end_at', '13:00:00');
        setDisplayEndTime('1:00 PM');
      }
    } else {
      // If deadline is cleared, clear times
      handleChange('start_at', null);
      handleChange('end_at', null);
      setDisplayStartTime('');
      setDisplayEndTime('');
    }
  }, [formData.deadline, handleChange, isEditingExistingTask]);

  // Auto-grow title textarea to fit its content
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [formData.title]);

  // Focus on date field when focusOnDate is true
  useEffect(() => {
    if (focusOnDate) {
      const input = document.getElementById('deadline') as HTMLInputElement | null;
      input?.focus();
      openDeadlinePicker();
    }
  }, [focusOnDate]);
  const renderStartTimeInput = () => {
    return <div className="w-full">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Start time</label>
        <div className="relative flex items-center w-full">
          <input type="time" onClick={e => { try { e.currentTarget.showPicker(); } catch { /* picker already open or unsupported */ } }} value={formData.start_at ? formData.start_at.slice(0, 5) : ''} onChange={e => {
          const v = e.target.value; // HH:MM (24h)
          setIsManualTimeUpdate(true);
          handleChange('start_at', v ? `${v}:00` : null);
          setDisplayStartTime(v ? to12Hour(v) : '');
          setTimeout(() => setIsManualTimeUpdate(false), 100);
        }} className="w-full px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:border-[var(--accent-primary)] transition-all leading-6" />
        </div>
        {displayErrors.start_at && <p className="mt-1 text-base text-red-500">{displayErrors.start_at}</p>}
      </div>;
  };
  const renderEndTimeInput = () => {
    return <div className="w-full">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{formData.isRecurring ? 'End Time' : 'Deadline'}</label>
        <div className="relative flex items-center w-full">
          <input type="time" onClick={e => { try { e.currentTarget.showPicker(); } catch { /* picker already open or unsupported */ } }} value={formData.end_at ? formData.end_at.slice(0, 5) : ''} onChange={e => {
          const v = e.target.value;
          setIsManualTimeUpdate(true);
          handleChange('end_at', v ? `${v}:00` : null);
          setDisplayEndTime(v ? to12Hour(v) : '');
          setTimeout(() => setIsManualTimeUpdate(false), 100);
        }} className="w-full px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:border-[var(--accent-primary)] transition-all leading-6" />
        </div>
        {displayErrors.end_at && <p className="mt-1 text-base text-red-500">{displayErrors.end_at}</p>}
      </div>;
  };
  return <BaseModal isOpen={true} onClose={onClose} title={modalTitle} maxWidth="max-w-2xl" showCloseButton={true}>
      {renderTabSelector()}

      <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;

        // Check if focused on text inputs (title, assignment, time inputs)
        const isTextInput = (activeElement instanceof HTMLInputElement && (activeElement.type === 'text' || activeElement.type === 'time')) || activeElement?.id === 'title' || activeElement?.id === 'assignment';

        // Check if focused in description editor (TipTap/ProseMirror)
        const isInDescription = activeElement instanceof HTMLElement && (activeElement.classList?.contains('ProseMirror') || activeElement.closest('.ProseMirror') !== null);

        // Submit form only if in text inputs, not in description editor
        if (isTextInput && !isInDescription) {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit(e as any);
        }
      }
    }}>
        {/* Main Content - Single Column */}
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Title and Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={initialAssignment ? 'sm:col-span-2' : ''}>
              <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Title:
              </label>
              <textarea id="title" ref={titleRef} rows={1} value={formData.title} onChange={e => handleChange('title', e.target.value)} className={`w-full px-3 py-2 bg-[var(--bg-primary)] border-2 ${displayErrors.title ? 'border-red-500' : 'border-[var(--border-primary)]'} rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:border-[var(--accent-primary)] transition-all resize-none overflow-hidden leading-6`} required placeholder="Enter task title" />
              {displayErrors.title && <p className="mt-1 text-base text-red-500">{displayErrors.title}</p>}
            </div>

            {!initialAssignment && <div>
                <label htmlFor="assignment" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Assignment:
                </label>
                <AutocompleteInput id="assignment" value={formData.assignment} onChange={value => handleChange('assignment', value)} error={displayErrors.assignment} required placeholder="Enter assignment name" suggestions={uniqueAssignments} />
              </div>}
          </div>

          {/* Workspace (new tasks only) */}
          {!initialTask && selectableWorkspaces.length > 0 && <div>
              <label htmlFor="workspace" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Workspace:
              </label>
              <select id="workspace" value={selectedWorkspace?.id ?? ''} onChange={e => {
            const ws = selectableWorkspaces.find((w: any) => w.id === e.target.value);
            if (ws) setSelectedWorkspace(ws);
          }} className="w-full px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:border-[var(--accent-primary)] transition-all leading-6">
                {selectableWorkspaces.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>}

          {/* Difficulty and Date */}
          <div className="space-y-4">
            {!formData.isRecurring ? <div className="space-y-4">
                <div>
                  {renderDifficultySelector()}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:flex-1">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Deadline</label>
                    {renderDeadlinePicker()}
                  </div>
                  {renderRecurrenceToggle()}
                </div>
              </div> : <div className="space-y-4">
                {renderDifficultySelector()}
                {/* Recurring tasks always show start/end time */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:flex-1">
                    {renderStartTimeInput()}
                  </div>
                  <div className="sm:flex-1">
                    {renderEndTimeInput()}
                  </div>
                  {renderRecurrenceToggle()}
                </div>
                {/* Weekday selector — full width, right below the time fields */}
                <div className="w-full">
                  {renderRecurrenceSection()}
                </div>
              </div>}

          </div>

          {/* Description — Tab moves focus out of the editor instead of indenting */}
          <div className="min-h-[120px]" onKeyDown={e => {
            if (e.key !== 'Tab') return;
            const target = e.target as HTMLElement;
            if (!target.closest('.ProseMirror')) return;
            e.preventDefault();
            const focusables = Array.from(document.querySelectorAll<HTMLElement>(
              '.BaseModal [role="dialog"] input:not([type="hidden"]):not([disabled]), .BaseModal [role="dialog"] textarea:not([disabled]), .BaseModal [role="dialog"] button:not([disabled]), .BaseModal [role="dialog"] [tabindex="0"]'
            )).filter(el => el.offsetParent !== null);
            const idx = focusables.indexOf(target);
            const next = focusables[idx + (e.shiftKey ? -1 : 1)] ?? focusables[e.shiftKey ? focusables.length - 1 : 0];
            next?.focus();
          }}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Description (Supports Markdown)
            </label>
            <MarkdownWysiwyg initialTitle={formData.title} initialBody={formData.description} onChange={({
            body
          }) => handleChange('description', body)} showTitleInput={false} variant="tasks" className="min-h-full" />
            {displayErrors.description && <p className="mt-1 text-base text-red-500">{displayErrors.description}</p>}
          </div>

        </div>

        <div className="flex justify-end gap-2 mt-6 mb-4">
          <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-base font-medium">
            Cancel
          </button>
          <button type="submit" className="px-5 py-2 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors text-base font-semibold flex items-center gap-2">
            {initialTask ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </form>
    </BaseModal>;
};
export default TaskForm;