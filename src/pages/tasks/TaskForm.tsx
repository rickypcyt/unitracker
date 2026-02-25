import 'react-datepicker/dist/react-datepicker.css';
import '@/pages/calendar/datepicker-overrides.css';

import { Calendar, CheckCircle2, ChevronDown } from 'lucide-react';
import { FormActions, FormButton } from '@/modals/FormElements';
import { parseDateForDB, to12Hour, to24Hour } from '@/utils/timeUtils';
import { useAuth, useWorkspace } from '@/store/appStore';
import { useEffect, useRef, useState } from 'react';

import AutocompleteInput from '@/modals/AutocompleteInput';
import BaseModal from '@/modals/BaseModal';
import DatePicker from 'react-datepicker';
import LocalWorkspaceSelector from './LocalWorkspaceSelector';
import MarkdownWysiwyg from '@/MarkdownWysiwyg';
import { StatusSelector } from '@/components/StatusSelector';
import { useFormState } from '@/hooks/useFormState';
import { useTaskSubmit } from '@/hooks/tasks/useTaskSubmit';
import { useTasks } from '@/store/appStore';

type TaskFormProps = {
  initialAssignment?: string | null;
  initialTask?: any | null;
  initialDeadline?: string | Date | null;
  focusOnDate?: boolean;
  onClose: () => void;
  onTaskCreated?: (id: string) => void;
  onSwitchToAI?: () => void;
};

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: 'text-[#00FF41]' },
  { value: 'medium', label: 'Medium', color: 'text-[#00BFFF]' },
  { value: 'hard', label: 'Hard', color: 'text-[#FF003C]' }
] as const;

const TaskForm = ({
  initialAssignment = null,
  initialTask = null,
  initialDeadline = null,
  focusOnDate = false,
  onClose,
  onTaskCreated,
  onSwitchToAI
}: TaskFormProps) => {
  const { saveTask } = useTaskSubmit();
  const workspace = useWorkspace();
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { workspaces, currentWorkspace: activeWorkspace } = workspace;
  const datePickerRef = useRef<any>(null);

  // Local workspace state for this task only
  const [selectedWorkspace, setSelectedWorkspace] = useState(() => {
    // If current workspace is "All", select the first available workspace instead
    if (activeWorkspace?.id === 'all' && workspaces && workspaces.length > 0) {
      return workspaces[0];
    }
    return activeWorkspace;
  });

  // Status state
  const [selectedStatus, setSelectedStatus] = useState(initialTask?.status || 'not_started');

  const typedUser = user as any;

  const getInitialRecurrence = () => {
    if (initialTask?.recurrence_type === 'weekly' && Array.isArray(initialTask?.recurrence_weekdays))
      return initialTask.recurrence_weekdays;

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
    recurrence_weekdays: getInitialRecurrence(),
  };

  const validationRules = {
    title: { required: true, minLength: 3, maxLength: 100 },
    assignment: { required: true },
    difficulty: { required: true },
    description: { maxLength: 500 },
    deadline: { required: false, validate: validateDeadline },
    start_at: { required: false, validate: validateTime },
    end_at: { required: false, validate: validateTime },
  };

  const { formData, errors, handleChange, validateForm, hasInteracted } = useFormState(
    initialFormState as any,
    validationRules as any
  ) as any;
  const [recurrenceError, setRecurrenceError] = useState<string | null>(null);
  const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isEditingExistingTask = Boolean(initialTask);

  console.log('TaskForm Initial State:', { initialAssignment, initialTask, hasSubmitted });

  // Force hasSubmitted to be false initially (debug)
  useEffect(() => {
    if (hasSubmitted) {
      console.warn('hasSubmitted was true initially, forcing to false');
      setHasSubmitted(false);
    }
  }, []);

  // Only show errors after user has interacted with form or attempted to submit
  const displayErrors = (hasInteracted || hasSubmitted) ? errors : {};

  // Debug: Log the states to understand what's happening
  console.log('TaskForm Debug:', { hasInteracted, hasSubmitted, errors, displayErrors });

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
    console.log('useEffect initialAssignment:', initialAssignment);
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
      console.log('Validating times - start_at:', JSON.stringify(formData.start_at), 'end_at:', JSON.stringify(formData.end_at));
      const start24 = to24Hour(formData.start_at);
      const end24 = to24Hour(formData.end_at);
      console.log('Converted times - start24:', start24, 'end24:', end24);
      if (!start24) {
        console.log('Start time validation failed');
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
      const updatedFormData = { ...formData };

      const saved = await saveTask({
        formData: {
          ...updatedFormData,
          status: selectedStatus,
        },
        userId: typedUser.id,
        initialTask,
        activeWorkspaceId: selectedWorkspace?.id ?? null,
        parseDateForDB: parseDateForDB,
      });

      if (!initialTask && saved?.id && onTaskCreated) {
        onTaskCreated(saved.id);
      }

      if (!initialTask) {
        window.dispatchEvent(new CustomEvent('refreshTaskList'));
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
    return '';
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
    timePortion = timePortion
      .replace(/[zZ]$/, '')
      .split('+')[0]!
      .split('-')[0]!;

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

    return isNaN(date.getTime())
      ? 'Please enter a valid date in DD/MM/YYYY format'
      : true;
  }

  function validateTime(value: string): true | string {
    if (!value) return true;

    // Validate 12h AM/PM format (HH:MM AM/PM) or 24h format (HH:MM)
    const time12Regex = /^(\d{1,2}):([0-5][0-9])\s*(AM|PM)$/i;
    const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return (time12Regex.test(value) || time24Regex.test(value))
      ? true
      : 'Please enter a valid time (e.g., 10:30 AM or 14:30)';
  }

  // Computed values
  const uniqueAssignments = [...new Set(
    tasks
      .map((task: any) => task.assignment || 'No Subject')
      .filter((a) => a && a !== 'No Subject')
  )].sort();

  const modalTitle = initialTask
    ? 'Edit Task'
    : (initialAssignment ? `Add Task for ${initialAssignment}` : 'Add Task');

  function formatDateOnlyForDisplay(datetime: string): string {
    if (!datetime) return '';
    const date = new Date(datetime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function getSelectedDate() {
    if (!formData.deadline) return null;

    let date: Date;

    // Handle DD/MM/YYYY format
    if (formData.deadline.includes('/')) {
      const [day, month, year] = formData.deadline.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      date = new Date(formData.deadline);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    // Use start_at for time if available, otherwise default to 9:00 AM
    const timeString = formData.start_at || '09:00';
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hoursNum = parseInt(hours);
      const minutesNum = parseInt(minutes);
      if (!isNaN(hoursNum) && !isNaN(minutesNum) && hoursNum >= 0 && hoursNum <= 23 && minutesNum >= 0 && minutesNum <= 59) {
        date.setHours(hoursNum, minutesNum, 0, 0);
      } else {
        date.setHours(9, 0, 0, 0);
      }
    } else {
      date.setHours(9, 0, 0, 0);
    }
    return date;
  }

  // Render Components
  const renderTabSelector = () => (
    <div className="w-full flex justify-center items-center select-none mb-4 sm:mb-4 px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="cursor-pointer font-semibold transition-colors duration-150 text-sm sm:text-base text-[var(--accent-primary)]">
          Manual
        </span>
        <span className="text-[var(--border-primary)] font-bold text-sm sm:text-base mx-1">|</span>
        <span
          className="cursor-pointer font-semibold transition-colors duration-150 text-sm sm:text-base text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
          onClick={() => {
            console.log('Switching to AI mode...');
            onSwitchToAI?.();
          }}
        >
          Auto (AI)
        </span>
      </div>
    </div>
  );

  const renderDifficultySelector = () => {
    const selectedOption = DIFFICULTY_OPTIONS.find(option => option.value === formData.difficulty) || DIFFICULTY_OPTIONS[1];

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Difficulty</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDifficultyDropdownOpen(!isDifficultyDropdownOpen)}
            className="w-full px-4 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] flex items-center justify-between"
          >
            <span className={selectedOption.color}>{selectedOption.label}</span>
            <ChevronDown
              size={20}
              className={`text-[var(--text-secondary)] transition-transform duration-200 ${isDifficultyDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDifficultyDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg shadow-lg">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    handleChange('difficulty', option.value);
                    setIsDifficultyDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors ${option.value === formData.difficulty ? 'bg-[var(--bg-secondary)]' : ''
                    } first:rounded-t-lg last:rounded-b-lg`}
                >
                  <span className={option.color}>{option.label}</span>
                  {option.value === formData.difficulty && (
                    <CheckCircle2 size={16} className={option.color} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {displayErrors.difficulty && (
          <p className="mt-1 text-base text-red-500">{displayErrors.difficulty}</p>
        )}
      </div>
    );
  };

  const renderDatePicker = () => (
    <div className="w-full">
      <div className="relative flex items-center w-full">
        <DatePicker
          id="deadline"
          ref={datePickerRef}
          selected={getSelectedDate()}
          onChange={(date: Date | null) => {
            if (date) {
              // Convert to DD/MM/YYYY format for display
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              handleChange('deadline', `${day}/${month}/${year}`);
            } else {
              handleChange('deadline', '');
              handleChange('start_at', null);
              handleChange('end_at', null);
              setDisplayStartTime('');
              setDisplayEndTime('');
            }
          }}
          dateFormat="dd/MM/yyyy"
          placeholderText="DD/MM/YYYY"
          wrapperClassName="w-full"
          className="w-full"
          customInput={
            <input
              type="text"
              readOnly
              value={formData.deadline ? formatDateOnlyForDisplay(formData.deadline) : 'None'}
              className={`w-full pl-12 pr-10 py-2 bg-[var(--bg-primary)] border-2 ${displayErrors.deadline ? 'border-red-500' : 'border-[var(--border-primary)]'
                } rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]`}
              style={{ width: '100%' }}
            />
          }
          popperPlacement="bottom-start"
          calendarClassName="bg-[var(--bg-primary)] border-2 border-[var(--accent-primary)] rounded-lg shadow-lg text-[var(--text-primary)]"
          dayClassName={(date: Date) =>
            date.getDay() === 0 || date.getDay() === 6 ? 'text-red-500' : ''
          }
        />
        <button
          type="button"
          onClick={() => {
            handleChange('deadline', '');
            handleChange('start_at', null);
            handleChange('end_at', null);
            setDisplayStartTime('');
            setDisplayEndTime('');
          }}
          className="absolute right-2 top-0 bottom-0 w-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 cursor-pointer transition-colors"
          tabIndex={-1}
          title="Clear deadline"
          style={{ zIndex: 2 }}
        >
          <span className="text-xl font-bold leading-none">×</span>
        </button>
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            handleChange('deadline', `${day}/${month}/${year}`);
            // Clear time when setting to today to avoid invalid time combinations
            handleChange('start_at', null);
            handleChange('end_at', null);
            setDisplayStartTime('');
            setDisplayEndTime('');
          }}
          className="absolute left-2 top-0 bottom-0 w-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          tabIndex={-1}
          title="Set to today"
        >
          <Calendar size={20} />
        </button>
      </div>
      {displayErrors.deadline && (
        <p className="mt-1 text-base text-red-500">{displayErrors.deadline}</p>
      )}
    </div>
  );

  const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 ... Sun=0 (JS getDay())

  const renderRecurrenceSection = () => (
    <div className="my-6">
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={formData.isRecurring}
            onChange={(e) => {
              setRecurrenceError(null);
              handleChange('isRecurring', e.target.checked);
            }}
            className="opacity-0 absolute h-5 w-5"
          />
          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors duration-200
            ${formData.isRecurring
              ? 'bg-transparent border-[var(--accent-primary)]'
              : 'bg-transparent border-[var(--border-primary)]'}`}>
            {formData.isRecurring && (
              <svg className="w-3.5 h-3.5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-[var(--text-primary)] font-medium">Repeat weekly (e.g. classes)</span>
      </label>
      {recurrenceError && (
        <p className="mt-2 text-base text-red-500">{recurrenceError}</p>
      )}
      {formData.isRecurring && (
        <div className="mt-3">
          <p className="text-sm text-[var(--text-secondary)] mb-2">Repeat on:</p>
          <div className="flex flex-wrap gap-1">
            {WEEKDAY_VALUES.map((d, i) => (
              <label
                key={d}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${(formData.recurrence_weekdays || []).includes(d)
                    ? 'border-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-medium'
                    : 'border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={(formData.recurrence_weekdays || []).includes(d)}
                  onChange={(e) => {
                    setRecurrenceError(null);
                    const current = (formData.recurrence_weekdays || []) as number[];
                    const next = e.target.checked
                      ? [...current, d].sort((a, b) => a - b)
                      : current.filter((x) => x !== d);
                    handleChange('recurrence_weekdays', next);
                  }}
                />
                {WEEKDAY_LABELS[i]}
              </label>
            ))}
          </div>
          {displayErrors.recurrence_weekdays && (
            <p className="mt-1 text-base text-red-500">{displayErrors.recurrence_weekdays}</p>
          )}
        </div>
      )}
    </div>
  );

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
        handleChange('start_at', '10:00:00');
        setDisplayStartTime('10:00 AM');
      }
      if (!formData.end_at) {
        handleChange('end_at', '11:00:00');
        setDisplayEndTime('11:00 AM');
      }
    } else {
      // If deadline is cleared, clear times
      handleChange('start_at', null);
      handleChange('end_at', null);
      setDisplayStartTime('');
      setDisplayEndTime('');
    }
  }, [formData.deadline, handleChange, isEditingExistingTask]);

  // Focus on date field when focusOnDate is true
  useEffect(() => {
    if (focusOnDate && datePickerRef.current) {
      // Focus on the date picker input
      const input = datePickerRef.current.input;
      if (input) {
        input.focus();
        // Open the date picker calendar
        if (datePickerRef.current.setOpen) {
          datePickerRef.current.setOpen(true);
        }
      }
    }
  }, [focusOnDate]);

  const renderStartTimeInput = () => {
    const getStartTimeBase = () => {
      const normalized = to24Hour(displayStartTime);
      if (normalized) return normalized;
      if (formData.start_at) return formData.start_at.slice(0, 5);
      return '10:00';
    };

    const incrementStartTime = () => {
      // Parse current 12-hour time to get 24-hour format
      const time24 = getStartTimeBase();

      let [hours = 0, minutes = 0] = time24.split(':').map(Number);
      minutes += 30;
      if (minutes >= 60) {
        minutes -= 60;
        hours = (hours + 1) % 24;
      }
      const newTime = to12Hour(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      setDisplayStartTime(newTime);
      setIsManualTimeUpdate(true);
      handleChange('start_at', `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      setTimeout(() => setIsManualTimeUpdate(false), 100);
    };

    const decrementStartTime = () => {
      // Parse current 12-hour time to get 24-hour format
      const time24 = getStartTimeBase();

      let [hours = 0, minutes = 0] = time24.split(':').map(Number);
      minutes -= 30;
      if (minutes < 0) {
        minutes += 60;
        hours = hours - 1 < 0 ? 23 : hours - 1;
      }
      const newTime = to12Hour(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      setDisplayStartTime(newTime);
      setIsManualTimeUpdate(true);
      handleChange('start_at', `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      setTimeout(() => setIsManualTimeUpdate(false), 100);
    };

    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Start time</label>
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={displayStartTime}
            onChange={(e) => {
              setRecurrenceError(null);
              setDisplayStartTime(e.target.value);
            }}
            onBlur={(e) => {
              const val = e.target.value.trim();
              console.log('Start time onBlur - input value:', JSON.stringify(val));
              if (val) {
                const time24 = to24Hour(val);
                console.log('Start time onBlur - converted to 24h:', time24);
                if (time24) {
                  handleChange('start_at', `${time24}:00`);
                  console.log('Start time onBlur - saved to formData:', `${time24}:00`);
                } else {
                  console.log('Start time onBlur - invalid format, restoring previous value');
                  // If invalid, restore previous value
                  const prev24 = formData.start_at ? formData.start_at.slice(0, 5) : '10:00';
                  setDisplayStartTime(to12Hour(prev24));
                }
              }
            }}
            className="w-full px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] pr-8"
            placeholder="10:00 AM"
          />
          <div className="absolute right-2 flex flex-col gap-0">
            <button
              type="button"
              onClick={incrementStartTime}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-0.5 leading-none text-xs"
              title="Increase time"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={decrementStartTime}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-0.5 leading-none text-xs"
              title="Decrease time"
            >
              ▼
            </button>
          </div>
        </div>
        {displayErrors.start_at && <p className="mt-1 text-base text-red-500">{displayErrors.start_at}</p>}
      </div>
    );
  };

  const renderEndTimeInput = () => {
    const getEndTimeBase = () => {
      const normalized = to24Hour(displayEndTime);
      if (normalized) return normalized;
      if (formData.end_at) return formData.end_at.slice(0, 5);
      return '11:00';
    };

    const incrementEndTime = () => {
      // Parse current 12-hour time to get 24-hour format
      const time24 = getEndTimeBase();

      let [hours = 0, minutes = 0] = time24.split(':').map(Number);
      minutes += 30;
      if (minutes >= 60) {
        minutes -= 60;
        hours = (hours + 1) % 24;
      }
      const newTime = to12Hour(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      setDisplayEndTime(newTime);
      setIsManualTimeUpdate(true);
      handleChange('end_at', `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      setTimeout(() => setIsManualTimeUpdate(false), 100);
    };

    const decrementEndTime = () => {
      // Parse current 12-hour time to get 24-hour format
      const time24 = getEndTimeBase();

      let [hours = 0, minutes = 0] = time24.split(':').map(Number);
      minutes -= 30;
      if (minutes < 0) {
        minutes += 60;
        hours = hours - 1 < 0 ? 23 : hours - 1;
      }
      const newTime = to12Hour(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      setDisplayEndTime(newTime);
      setIsManualTimeUpdate(true);
      handleChange('end_at', `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      setTimeout(() => setIsManualTimeUpdate(false), 100);
    };

    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">End time (Time Limit/Deadline)</label>
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={displayEndTime}
            onChange={(e) => {
              setRecurrenceError(null);
              setDisplayEndTime(e.target.value);
            }}
            onBlur={(e) => {
              const val = e.target.value.trim();
              console.log('End time onBlur - input value:', JSON.stringify(val));
              if (val) {
                const time24 = to24Hour(val);
                console.log('End time onBlur - converted to 24h:', time24);
                if (time24) {
                  handleChange('end_at', `${time24}:00`);
                  console.log('End time onBlur - saved to formData:', `${time24}:00`);
                } else {
                  console.log('End time onBlur - invalid format, restoring previous value');
                  // If invalid, restore previous value
                  const prev24 = formData.end_at ? formData.end_at.slice(0, 5) : '11:00';
                  setDisplayEndTime(to12Hour(prev24));
                }
              }
            }}
            className="w-full px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] pr-8"
            placeholder="11:00 AM"
          />
          <div className="absolute right-2 flex flex-col gap-0">
            <button
              type="button"
              onClick={incrementEndTime}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-0.5 leading-none text-xs"
              title="Increase time"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={decrementEndTime}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-0.5 leading-none text-xs"
              title="Decrease time"
            >
              ▼
            </button>
          </div>
        </div>
        {displayErrors.end_at && <p className="mt-1 text-base text-red-500">{displayErrors.end_at}</p>}
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      maxWidth="max-w-2xl"
      showCloseButton={true}
    >
      {renderTabSelector()}

      <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const activeElement = document.activeElement;
          
          // Check if focused on title input
          const isTitleInput = activeElement?.id === 'title';
          
          // Check if focused on subject autocomplete input
          const isSubjectInput = activeElement?.id === 'assignment';
          
          // Check if focused in description editor (TipTap/ProseMirror)
          const isInDescription = 
            activeElement?.classList?.contains('ProseMirror') ||
            activeElement?.closest('.ProseMirror') !== null;
          
          // Submit form only if in title or subject inputs, not in description
          if ((isTitleInput || isSubjectInput) && !isInDescription) {
            e.preventDefault();
            e.stopPropagation();
            const formEvent = new Event('submit', { cancelable: true });
            e.currentTarget.dispatchEvent(formEvent);
          }
        }
      }}>
        {/* Workspace and Status Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <LocalWorkspaceSelector
              selectedWorkspace={selectedWorkspace}
              onWorkspaceChange={setSelectedWorkspace}
            />
          </div>
          <div>
            <StatusSelector
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          </div>
        </div>

        {/* Main Content - Single Column */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Title and Subject */}
          <div className={`${initialAssignment ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}`}>
            <div className={initialAssignment ? '' : ''}>
              <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full px-3 py-2 bg-[var(--bg-primary)] border-2 ${displayErrors.title ? 'border-red-500' : 'border-[var(--border-primary)]'
                  } rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]`}
                required
                placeholder="Enter task title"
              />
              {displayErrors.title && (
                <p className="mt-1 text-base text-red-500">{displayErrors.title}</p>
              )}
            </div>

            {!initialAssignment && (
              <div>
                <label htmlFor="assignment" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Subject
                </label>
                <AutocompleteInput
                  id="assignment"
                  value={formData.assignment}
                  onChange={(value) => handleChange('assignment', value)}
                  error={displayErrors.assignment}
                  required
                  placeholder="Enter subject name"
                  suggestions={uniqueAssignments}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="min-h-[120px]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Description (Supports Markdown)
            </label>
            <MarkdownWysiwyg
              initialTitle={formData.title}
              initialBody={formData.description}
              onChange={({ body }) => handleChange('description', body)}
              showTitleInput={false}
              variant="tasks"
              className="min-h-full"
            />
            {displayErrors.description && (
              <p className="mt-1 text-base text-red-500">{displayErrors.description}</p>
            )}
          </div>

          {/* Difficulty and Date */}
          <div className="space-y-4">
            {!formData.isRecurring ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
                  {renderDatePicker()}
                </div>
                <div>
                  {renderDifficultySelector()}
                </div>
              </div>
            ) : (
              <div>
                {renderDifficultySelector()}
              </div>
            )}

            {/* Recurrence Section */}
            <div>
              {renderRecurrenceSection()}
            </div>

            {/* Time fields */}
            {formData.isRecurring ? (
              // For recurring tasks, always show both start and end time
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  {renderStartTimeInput()}
                </div>
                <div>
                  {renderEndTimeInput()}
                </div>
              </div>
            ) : (
              // For non-recurring tasks, only show time limit if date is selected
              formData.deadline && (
                <div className="mb-4">
                  {renderEndTimeInput()}
                </div>
              )
            )}
          </div>
        </div>

        <FormActions className="mt-6">
          <FormButton type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </FormButton>
          <FormButton
            type="submit"
            variant="custom"
            className="border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]"
          >
            {initialTask ? 'Save Changes' : 'Add Task'}
          </FormButton>
        </FormActions>
      </form>
    </BaseModal>
  );
};

export default TaskForm;