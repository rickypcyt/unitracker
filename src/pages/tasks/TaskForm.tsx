import 'react-datepicker/dist/react-datepicker.css';
import '@/pages/calendar/datepicker-overrides.css';

import { Calendar, CheckCircle2, ChevronDown } from 'lucide-react';
import { FormActions, FormButton, FormInput } from '@/modals/FormElements';
import { useAuth, useWorkspace } from '@/store/appStore';
import { useEffect, useRef, useState } from 'react';

import AIPreviewModal from './AIPreviewModal';
import AutocompleteInput from '@/modals/AutocompleteInput';
import BaseModal from '@/modals/BaseModal';
import DatePicker from 'react-datepicker';
import MarkdownWysiwyg from '@/MarkdownWysiwyg';
import { addTask } from '@/store/TaskActions';
import { normalizeNaturalOrYMDDate } from '@/hooks/tasks/useTaskDateUtils';
import { useFormState } from '@/hooks/useFormState';
import { useTaskAI } from '@/hooks/tasks/useTaskAI';
import { useTaskSubmit } from '@/hooks/tasks/useTaskSubmit';
import { useTasks } from '@/store/appStore';

type TaskFormProps = {
  initialAssignment?: string | null;
  initialTask?: any | null;
  initialDeadline?: string | Date | null;
  initialActiveTab?: 'ai' | 'manual';
  onClose: () => void;
  onTaskCreated?: (id: string) => void;
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
  onClose, 
  onTaskCreated 
}: TaskFormProps) => {
  const { saveTask } = useTaskSubmit();
  const workspace = useWorkspace();
  const { user } = useAuth();
  const { tasks } = useTasks();
  const activeWorkspace = workspace.currentWorkspace;
  const datePickerRef = useRef<any>(null);

  const typedUser = user as any;

  const getInitialRecurrence = () => {
    if (initialTask?.recurrence_type === 'weekly' && Array.isArray(initialTask?.recurrence_weekdays))
      return initialTask.recurrence_weekdays;
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

  const { formData, errors, handleChange, validateForm } = useFormState(
    initialFormState as any, 
    validationRules as any
  ) as any;
  const [recurrenceError, setRecurrenceError] = useState<string | null>(null);
  const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] = useState(false);

  // AI Hook
  const {
    AI_DEBUG,
    activeTab, 
    setActiveTab,
    aiPrompt, 
    setAiPrompt,
    aiLoading, 
    setAiLoading,
    aiError, 
    setAiError,
    aiSuccess,
    setAiSuccess,
    showAIPreview, 
    setShowAIPreview,
    aiParsedTasks, 
    setAiParsedTasks,
    aiTextareaRef,
    setAiAbortController,
    aiCancelledRef,
    handleCancelAI,
  } = useTaskAI(initialTask ? 'ai' : 'manual');

  // Effects
  useEffect(() => {
    if (initialAssignment) {
      handleChange('assignment', initialAssignment);
    }
  }, [initialAssignment, handleChange]);

  useEffect(() => {
    if (initialTask) {
      setActiveTab('manual');
    }
  }, [initialTask, setActiveTab]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.isRecurring) {
      setRecurrenceError(null);
      if (!formData.recurrence_weekdays?.length) {
        setRecurrenceError('Select at least one day');
        return;
      }
      if (!formData.start_at) {
        setRecurrenceError('Start time is required');
        return;
      }
      if (!formData.end_at) {
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
        console.warn('Validation errors:', errors);
        return;
      }
    }

    try {
      if (!typedUser) return;
      
      const saved = await saveTask({
        formData,
        userId: typedUser.id,
        initialTask,
        activeWorkspaceId: activeWorkspace?.id ?? null,
        parseDateForDB: (date: string | null | undefined) => {
          if (!date) return null;

          // If it's already in ISO format, return as is
          if (date.match(/^\d{4}-\d{2}-\d{2}/)) return date;

          // Handle DD/MM/YYYY format and combine with time
          const [day, month, year] = date.split('/');
          if (day && month && year) {
            const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            
            // Always use midnight for deadline (date only)
            return `${dateStr}T00:00:00`;
          }
          return null;
        },
      });
      
      if (!initialTask && saved?.id && onTaskCreated) {
        onTaskCreated(saved.id);
      }
      
      if (!initialTask) {
        window.dispatchEvent(new CustomEvent('refreshTaskList'));
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  function mapAITaskToFormData(task: any) {
    const normalizedDate = task.date && task.date !== 'null' 
      ? normalizeNaturalOrYMDDate(task.date) 
      : null;

    return {
      title: task.task || '',
      description: task.description || (task.subject ? `Asignatura: ${task.subject}` : ''),
      assignment: task.subject || '',
      deadline: normalizedDate,
      difficulty: task.difficulty?.toLowerCase() || 'medium',
      isRecurring: false,
      recurrence_weekdays: null,
      start_at: null,
      end_at: null,
    };
  }

  
  const handleAIAcceptAll = async (tasks: any[]) => {
    const mappedTasks = tasks.map(mapAITaskToFormData);
    if (AI_DEBUG) console.log('[AI][accept-all][count]', mappedTasks.length);
    
    await Promise.all(mappedTasks.map(addTask));
    setShowAIPreview(false);
    onClose();
  };

  const handleCancel = () => {
    // Blur any active editor to prevent focus issues
    if (document.activeElement instanceof HTMLElement && 'blur' in document.activeElement) {
      document.activeElement.blur();
    }
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

  // Convert 24h format (HH:MM) or timestamptz to 12h AM/PM format
  function to12Hour(time24: string): string {
    if (!time24) return '';
    
    try {
      let hours = 0;
      let minutes = 0;
      
      // Handle ISO date format: '2026-02-09T17:00:00+00:00'
      if (time24.includes('T')) {
        const timePart = time24.split('T')[1]; // '17:00:00+00:00'
        if (!timePart) return '';
        
        // Remove timezone info if present
        const cleanTimePart = timePart.split('+')[0]?.split('-')[0];
        if (!cleanTimePart) return '';
        
        const parts = cleanTimePart.split(':').map(Number);
        hours = parts[0] ?? 0;
        minutes = parts[1] ?? 0;
      }
      // Handle timestamptz format: '2026-02-09 09:00:00+00'
      else if (time24.includes(' ')) {
        const timePart = time24.split(' ')[1]; // '09:00:00+00'
        if (!timePart) return '';
        
        // Remove timezone info if present
        const cleanTimePart = timePart.split('+')[0]?.split('-')[0];
        if (!cleanTimePart) return '';
        
        const parts = cleanTimePart.split(':').map(Number);
        hours = parts[0] ?? 0;
        minutes = parts[1] ?? 0;
      }
      // Handle simple time format: "HH:MM" or "HH:MM:SS"
      else if (time24.includes(':')) {
        const [h, m] = time24.split(':').map(Number);
        hours = h ?? 0;
        minutes = m ?? 0;
      }
      else {
        return '';
      }
      
      // Validate hours and minutes
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('Invalid time values in to12Hour (TaskForm):', time24, { hours, minutes });
        return '';
      }
      
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
      return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch (error) {
      console.warn('Error in to12Hour (TaskForm):', time24, error);
      return '';
    }
  }

  function getInitialStartTime(): string {
    // For normal tasks, check if there's a start_at
    if (initialTask?.start_at) {
      return to12Hour(initialTask.start_at);
    }
    // Default for recurring tasks
    return '10:00 AM';
  }

  function getInitialEndTime(): string {
    // For normal tasks, check if there's an end_at
    if (initialTask?.end_at) {
      return to12Hour(initialTask.end_at);
    }
    // Default for recurring tasks
    return '11:00 AM';
  }

  function getInitialStartTimeForForm(): string {
    // Return the original timestamptz format for formData
    return initialTask?.start_at || '10:00:00';
  }

  function getInitialEndTimeForForm(): string {
    // Return the original timestamptz format for formData
    return initialTask?.end_at || '11:00:00';
  }

  // Convert 12h AM/PM format or ISO timestamp to 24h format (HH:MM)
  function to24Hour(time12: string): string {
    console.log('to24Hour input:', JSON.stringify(time12));
    
    if (!time12) {
      console.log('to24Hour: empty input');
      return '';
    }
    
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
    console.log('to24Hour: time without seconds:', JSON.stringify(timeWithoutSeconds));
    
    // Check if it's already in 24h format (HH:MM)
    const is24hFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeWithoutSeconds);
    console.log('to24Hour: is 24h format?', is24hFormat);
    
    if (is24hFormat) {
      console.log('to24Hour: already 24h, returning as-is');
      return timeWithoutSeconds;
    }
    
    // Try 12h format
    const match = timeWithoutSeconds.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    console.log('to24Hour: 12h match:', match);
    
    if (match) {
      let hours = parseInt(match[1] ?? '0', 10);
      const minutes = parseInt(match[2] ?? '0', 10);
      const period = (match[3] ?? '').toUpperCase();
      console.log('to24Hour: parsed 12h - hours:', hours, 'minutes:', minutes, 'period:', period);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      const result = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      console.log('to24Hour: 12h result:', result);
      return result;
    }
    
    console.log('to24Hour: no valid format found, returning empty string');
    return '';
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

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiPrompt.trim()) {
      setAiError('Prompt required');
      return;
    }

    setAiError('');
    setAiLoading(true);
    aiCancelledRef.current = false;

    const controller = new AbortController();
    setAiAbortController(controller);

    const tStart = performance.now();
    let debugInterval: number | null = null;

    if (AI_DEBUG) {
      debugInterval = window.setInterval(() => {
        const elapsed = (performance.now() - tStart) / 1000;
        console.info(`[AI][elapsed] ${elapsed.toFixed(1)}s`);
      }, 1000);
    }

    try {
      const result = await callAIAPI(controller);
      
      if (aiCancelledRef.current) {
        console.log('[AI] Request was cancelled');
        return;
      }

      if (debugInterval) clearInterval(debugInterval);

      if (!result.success || !result.data) {
        setAiError(result.error || 'Failed to generate task');
        return;
      }

      const aiTask = result.data;
      console.log('[AI] Generated task:', aiTask);

      const mappedData = mapAITaskToFormData(aiTask);
      console.log('[AI] Mapped data:', mappedData);

      // Update form with AI-generated data
      Object.entries(mappedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          handleChange(key, value);
        }
      });

      // Switch to manual tab
      setActiveTab('manual');
      setAiPrompt('');
      setAiSuccess('Task generated successfully!');
      
      setTimeout(() => setAiSuccess(''), 3000);

    } catch (error: any) {
      if (debugInterval) clearInterval(debugInterval);
      
      if (aiCancelledRef.current) {
        console.log('[AI] Request was cancelled by user');
        return;
      }
      
      console.error('[AI] Error:', error);
      setAiError(error.message || 'Failed to generate task');
    } finally {
      setAiLoading(false);
      setAiAbortController(null);
    }
  };

  // Simple cache to avoid repeated requests
  const aiCache = useRef<Map<string, any>>(new Map());
  
  async function callAIAPI(controller: AbortController): Promise<{ success: boolean; data?: any; error?: string }> {
    const apiKey = import.meta.env['VITE_OPENROUTER_API_KEY'];
    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Check cache first
    const cacheKey = `${aiPrompt}_${currentDate}`;
    if (aiCache.current.has(cacheKey)) {
      if (AI_DEBUG) console.log('[AI][CACHE] Using cached result for:', cacheKey);
      return { success: true, data: aiCache.current.get(cacheKey) };
    }

    const modelCandidates = getModelCandidates();
    
    if (AI_DEBUG) {
      console.log('[AI][DEBUG] Starting API call with models:', modelCandidates);
      console.log('[AI][DEBUG] Prompt length:', aiPrompt.length, 'characters');
      console.log('[AI][DEBUG] Current date:', currentDate, 'Timezone:', tz);
    }
    
    for (const model of modelCandidates) {
      if (AI_DEBUG) console.log('[AI][try-model]', model);
      
      const modelStart = performance.now();
      
      try {
        const requestBody = {
          model,
          messages: [
            { 
              role: 'system', 
              content: buildSystemPrompt(currentDate, tz)
            },
            { 
              role: 'user', 
              content: `Texto: "${aiPrompt}"` 
            }
          ],
          temperature: 0.0,
          stream: false
        };

        if (AI_DEBUG) {
          console.log('[AI][DEBUG] Request body for', model, ':', JSON.stringify(requestBody, null, 2));
          console.log('[AI][DEBUG] System prompt length:', requestBody.messages[0]?.content?.length || 0, 'characters');
        }

        const fetchStart = performance.now();
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        const fetchEnd = performance.now();
        const fetchDuration = fetchEnd - fetchStart;

        if (aiCancelledRef.current) {
          return { success: false, error: 'Cancelled' };
        }

        if (AI_DEBUG) {
          console.log(`[AI][${model}] Fetch time: ${fetchDuration.toFixed(0)}ms`);
          console.log(`[AI][${model}] Response status: ${response.status} ${response.statusText}`);
        }

        if (response.ok) {
          const parseStart = performance.now();
          const data = await response.json();
          const parseEnd = performance.now();
          const parseDuration = parseEnd - parseStart;
          
          if (AI_DEBUG) {
            console.log(`[AI][${model}] JSON parse time: ${parseDuration.toFixed(0)}ms`);
            console.log(`[AI][${model}] Raw response:`, JSON.stringify(data, null, 2));
            
            // Log token usage if available
            if (data.usage) {
              console.log(`[AI][${model}] Token usage:`, {
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens
              });
            }
            
            // Log model info
            console.log(`[AI][${model}] Model used:`, data.model || 'Not specified');
            
            // Log finish reason
            if (data.choices?.[0]?.finish_reason) {
              console.log(`[AI][${model}] Finish reason:`, data.choices[0].finish_reason);
            }
          }

          const parsed = parseAIResponse(data);
          const parseAIEnd = performance.now();
          const parseAIDuration = parseAIEnd - parseEnd;
          
          if (AI_DEBUG) {
            console.log(`[AI][${model}] AI parsing time: ${parseAIDuration.toFixed(0)}ms`);
            console.log(`[AI][${model}] Parsed result:`, JSON.stringify(parsed, null, 2));
          }
          
          if (!parsed) {
            if (AI_DEBUG) console.log(`[AI][${model}] Failed to parse response`);
            continue;
          }
          
          const modelEnd = performance.now();
          const duration = modelEnd - modelStart;
          
          if (AI_DEBUG) {
            console.log(`[AI][${model}] Total success time: ${duration.toFixed(0)}ms`);
            console.log(`[AI][${model}] Time breakdown - Fetch: ${fetchDuration.toFixed(0)}ms, Parse: ${parseDuration.toFixed(0)}ms, AI: ${parseAIDuration.toFixed(0)}ms`);
            
            // Calculate tokens per second if usage data available
            if (data.usage?.total_tokens) {
              const tokensPerSec = (data.usage.total_tokens / (fetchDuration / 1000)).toFixed(1);
              console.log(`[AI][${model}] Performance: ${tokensPerSec} tokens/second`);
            }
          }
          
          // Cache the successful result
          aiCache.current.set(cacheKey, parsed);
          if (AI_DEBUG) console.log('[AI][CACHE] Cached result for:', cacheKey);
          
          return { success: true, data: parsed };
        } else {
          // Handle different HTTP error codes with specific debugging
          const errorData = await response.text();
          
          if (AI_DEBUG) {
            console.error(`[AI][${model}] HTTP ${response.status}:`, response.statusText);
            console.error(`[AI][${model}] Response:`, errorData);
            
            if (response.status === 404) {
              console.error(`[AI][${model}] Model not found in OpenRouter`);
            } else if (response.status === 401) {
              console.error(`[AI][${model}] Authentication failed - check API key`);
            } else if (response.status === 429) {
              console.error(`[AI][${model}] Rate limit exceeded`);
            } else if (response.status === 403) {
              console.error(`[AI][${model}] Access forbidden - model may not be available`);
            } else if (response.status >= 500) {
              console.error(`[AI][${model}] OpenRouter server error`);
            }
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          if (AI_DEBUG) console.log('[AI] request aborted');
          return { success: false, error: 'Aborted' };
        }
        
        // Enhanced debugging for different error types
        if (AI_DEBUG) {
          console.error(`[AI][${model}] Network/Request Error:`, err.message);
          
          if (err.message.includes('fetch')) {
            console.error(`[AI][${model}] Network connectivity issue`);
          } else if (err.message.includes('timeout')) {
            console.error(`[AI][${model}] Request timeout - model may be slow`);
          } else if (err.message.includes('CORS')) {
            console.error(`[AI][${model}] CORS issue - check OpenRouter configuration`);
          } else {
            console.error(`[AI][${model}] Unexpected error:`, err);
          }
        }
      }
    }

    // Enhanced debugging when all models fail
    if (AI_DEBUG) {
      console.error('[AI] All models failed. Summary:');
      console.error('[AI] Models attempted:', modelCandidates.join(', '));
      console.error('[AI] Check the following:');
      console.error('[AI] 1. API Key is valid and active');
      console.error('[AI] 2. Models are available in your OpenRouter plan');
      console.error('[AI] 3. Network connectivity to openrouter.ai');
      console.error('[AI] 4. Rate limits not exceeded');
    }

    return { success: false, error: 'All AI models failed' };
  }

  function getModelCandidates(): string[] {
    const baseModels = [
      'openai/gpt-oss-20b:free', // Primary
      'tngtech/deepseek-r1t2-chimera:free', // Fast fallback
      'x-ai/grok-4.1-fast:free', // Last resort
    ];

    const envModel = import.meta.env['VITE_OPENROUTER_MODEL'];
    const envList = envModel ? [String(envModel)] : [];

    // Try models in order of preference
    const candidates = [...envList, ...baseModels];

    // Deduplicate
    return candidates.filter((m: string, i: number, arr: string[]) => arr.indexOf(m) === i);
  }

  function buildSystemPrompt(currentDate: string, tz: string): string {
    return `ULTRA_DETERMINISTIC_MODE: JSON_OUTPUT_ONLY. NO_MARKDOWN. NO_QUOTES. NO_EXPLANATIONS. NO_META_CONTENT.

[${currentDate} ${tz}] [{"task":"name","description":"short","date":"YYYY-MM-DD","subject":"Subject","difficulty":"medium"}]

STRICT_RULES:
- INPUT_LANGUAGE → OUTPUT_LANGUAGE
- TODAY=${currentDate}, TOMORROW=${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
- MAX_50_CHARS_PER_DESCRIPTION
- RESPONSE_MUST_START_WITH_[ AND_END_WITH_]
- ABSOLUTELY_NO_MARKDOWN_FENCES
- ABSOLUTELY_NO_EXTRA_TEXT
- ABSOLUTELY_NO_QUOTES_AROUND_RESPONSE
- ONLY_VALID_JSON_ARRAY

ES:[{"task":"Hacer matemáticas","description":"Ejercicios","date":"2025-11-30","subject":"Matemáticas","difficulty":"medium"}]
EN:[{"task":"Do math","description":"Exercises","date":"2025-11-30","subject":"Math","difficulty":"medium"}]`;
  }

  // Cached regex patterns - compiled once for better performance
  const regexCache = useRef({
    markdownFence: /```(?:json)?\r?\n([\s\S]*?)```/i,
    markdownCleanup: /```(?:json)?|```/gi,
    modelPrefixes: /^(?:<s>\s*\[OUT\]\s*|<s>|\[OUT\]\s*)/,
    smartQuotes: /[\u201C\u201D\u2018\u2019]/g,
    trailingCommas: /,(\s*[}\]])/g
  });

  function parseAIResponse(data: any): any {
    const choice = data?.choices?.[0];
    const msg = choice?.message || {};

    if (AI_DEBUG) {
      console.log('[AI][PARSE] Data keys:', Object.keys(data || {}));
      console.log('[AI][PARSE] Choice exists:', !!choice);
      console.log('[AI][PARSE] Message keys:', Object.keys(msg || {}));
    }

    let content = '';
    
    // Extract content from various formats
    if (typeof msg.content === 'string' && msg.content.trim()) {
      content = msg.content;
      if (AI_DEBUG) console.log('[AI][PARSE] Content from msg.content');
    } else if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
      const arg = msg.tool_calls[0]?.function?.arguments;
      if (typeof arg === 'string' && arg.trim()) {
        content = arg;
        if (AI_DEBUG) console.log('[AI][PARSE] Content from tool_calls');
      }
    } else if (Array.isArray(msg.content)) {
      const firstText = msg.content.find((p: any) => typeof p?.text === 'string' && p.text.trim());
      if (firstText?.text) {
        content = firstText.text;
        if (AI_DEBUG) console.log('[AI][PARSE] Content from array content');
      }
    } else if (typeof choice?.text === 'string') {
      content = choice.text;
      if (AI_DEBUG) console.log('[AI][PARSE] Content from choice.text');
    }

    if (AI_DEBUG) {
      console.log('[AI][PARSE] Extracted content length:', content.length);
      console.log('[AI][PARSE] Raw content:', content);
    }

    if (!content.trim()) {
      if (AI_DEBUG) console.warn('[AI][empty-content]');
      return null;
    }

    const parseStart = performance.now();

    // Fast path: Try parsing directly first (most common case)
    try {
      const trimmed = content.trim();
      if ((trimmed[0] === '[' || trimmed[0] === '{') && 
          (trimmed[trimmed.length - 1] === ']' || trimmed[trimmed.length - 1] === '}')) {
        const result = JSON.parse(trimmed);
        if (AI_DEBUG) {
          console.log('[AI][TIMING] Fast path parse:', (performance.now() - parseStart).toFixed(0), 'ms');
          console.log('[AI][PARSE] Successfully parsed JSON with', Array.isArray(result) ? result.length : 1, 'items');
        }
        return result;
      }
    } catch {
      // Continue to cleanup path
    }

    // Cleanup path: Remove markdown fences
    const fenceMatch = content.match(regexCache.current.markdownFence);
    if (fenceMatch?.[1]) {
      content = fenceMatch[1].trim();
      if (AI_DEBUG) console.log('[AI][PARSE] Content from markdown fence');
    } else if (content.includes('```')) {
      content = content.replace(regexCache.current.markdownCleanup, '').trim();
      if (AI_DEBUG) console.log('[AI][PARSE] Content after markdown cleanup');
    }

    // Remove model prefixes (single pass)
    if (content.startsWith('<s>') || content.startsWith('[OUT]')) {
      const originalContent = content;
      content = content.replace(regexCache.current.modelPrefixes, '').trim();
      
      if (AI_DEBUG && originalContent !== content) {
        console.log('[AI][PARSE] Content after prefix cleanup');
        console.log('[AI][PARSE] Original length:', originalContent.length, 'Cleaned length:', content.length);
      }
    }

    if (AI_DEBUG) {
      console.log('[AI][PARSE] Final content to parse:', content);
      console.log('[AI][PARSE] Content preview (first 200 chars):', content.substring(0, 200));
    }

    // Try direct parse after cleanup
    try {
      const result = JSON.parse(content);
      if (AI_DEBUG) {
        console.log('[AI][TIMING] Cleanup path parse:', (performance.now() - parseStart).toFixed(0), 'ms');
        console.log('[AI][PARSE] Successfully parsed JSON with', Array.isArray(result) ? result.length : 1, 'items');
      }
      return result;
    } catch (error) {
      if (AI_DEBUG) {
        console.error('[AI][PARSE] JSON parse error:', error);
      }
      
      // Normalize and try again
      try {
        const normalized = normalizeJSON(content);
        const result = JSON.parse(normalized);
        if (AI_DEBUG) {
          console.log('[AI][TIMING] Normalized parse:', (performance.now() - parseStart).toFixed(0), 'ms');
          console.log('[AI][PARSE] Successfully parsed JSON with', Array.isArray(result) ? result.length : 1, 'items');
        }
        return result;
      } catch {
        // Last resort: extract balanced brackets
        const extracted = fastExtractBalanced(content);
        
        if (extracted) {
          if (AI_DEBUG) console.log('[AI][PARSE] Trying extracted content');
          try {
            const result = JSON.parse(normalizeJSON(extracted));
            if (AI_DEBUG) {
              console.log('[AI][TIMING] Extract+parse:', (performance.now() - parseStart).toFixed(0), 'ms');
              console.log('[AI][PARSE] Successfully parsed extracted JSON with', Array.isArray(result) ? result.length : 1, 'items');
            }
            return result;
          } catch (extractError) {
            if (AI_DEBUG) console.error('[AI][PARSE] Extracted content parse error:', extractError);
          }
        }
      }
    }

    if (AI_DEBUG) {
      console.log('[AI][TIMING] Total failed parse time:', (performance.now() - parseStart).toFixed(0), 'ms');
    }
    return null;
  }

  function normalizeJSON(text: string): string {
    // Single pass replacement for smart quotes (most common issue)
    const quotesFixed = text.replace(regexCache.current.smartQuotes, (match) => 
      match === '\u201C' || match === '\u201D' ? '"' : "'"
    );
    
    // Remove trailing commas
    return quotesFixed.replace(regexCache.current.trailingCommas, '$1').trim();
  }

  function fastExtractBalanced(text: string): string {
    // Try array first (most common in our use case)
    let start = text.indexOf('[');
    if (start !== -1) {
      let depth = 0;
      const len = text.length;
      for (let i = start; i < len; i++) {
        const char = text[i];
        if (char === '[') depth++;
        else if (char === ']') {
          depth--;
          if (depth === 0) return text.slice(start, i + 1);
        }
      }
      // Incomplete array, return what we have
      return text.slice(start);
    }
    
    // Try object
    start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      const len = text.length;
      for (let i = start; i < len; i++) {
        const char = text[i];
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) return text.slice(start, i + 1);
        }
      }
      // Incomplete object, return what we have
      return text.slice(start);
    }
    
    return '';
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

    if (formData.time && formData.time.includes(':')) {
      const [hours, minutes] = formData.time.split(':');
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
  const renderTabSelector = (isAIActive: boolean) => (
    <div className="w-full flex justify-center items-center select-none mb-4 sm:mb-4 px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className={`cursor-pointer font-semibold transition-colors duration-150 text-sm sm:text-base ${
            !isAIActive
              ? 'text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'
          }`}
          onClick={() => setActiveTab('manual')}
        >
          Manual
        </span>
        <span className="text-[var(--border-primary)] font-bold text-sm sm:text-base mx-1">|</span>
        <span
          className={`cursor-pointer font-semibold transition-colors duration-150 text-sm sm:text-base ${
            isAIActive
              ? 'text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'
          }`}
          onClick={() => setActiveTab('ai')}
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
                  className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors ${
                    option.value === formData.difficulty ? 'bg-[var(--bg-secondary)]' : ''
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
        {errors.difficulty && (
          <p className="mt-1 text-base text-red-500">{errors.difficulty}</p>
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
              handleChange('time', ''); // Clear time when date is cleared
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
              className={`w-full pl-12 pr-10 py-2 bg-[var(--bg-primary)] border-2 ${
                errors.deadline ? 'border-red-500' : 'border-[var(--border-primary)]'
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
            handleChange('time', ''); // Also clear time when clearing date
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
            handleChange('time', '');
          }}
          className="absolute left-2 top-0 bottom-0 w-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          tabIndex={-1}
          title="Set to today"
        >
          <Calendar size={20} />
        </button>
      </div>
      {errors.deadline && (
        <p className="mt-1 text-base text-red-500">{errors.deadline}</p>
      )}
    </div>
  );

  const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 ... Sun=0 (JS getDay())

  const renderRecurrenceSection = () => (
    <div className="mb-4">
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
                className={`inline-flex items-center px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  (formData.recurrence_weekdays || []).includes(d)
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
          {errors.recurrence_weekdays && (
            <p className="mt-1 text-base text-red-500">{errors.recurrence_weekdays}</p>
          )}
        </div>
      )}
    </div>
  );

  // Local state for time inputs (12h format for display)
  const [displayStartTime, setDisplayStartTime] = useState(() => {
    if (initialTask?.start_at) {
      return to12Hour(initialTask.start_at);
    }
    return '10:00 AM';
  });
  
  const [displayEndTime, setDisplayEndTime] = useState(() => {
    if (initialTask?.end_at) {
      return to12Hour(initialTask.end_at);
    }
    return '11:00 AM';
  });

  // Flag to prevent useEffect from overriding manual adjustments
  const [isManualTimeUpdate, setIsManualTimeUpdate] = useState(false);

  // Sync display times when formData changes externally (but not during manual updates)
  useEffect(() => {
    if (formData.start_at && !isManualTimeUpdate) {
      setDisplayStartTime(to12Hour(formData.start_at));
    }
  }, [formData.start_at, isManualTimeUpdate]);

  useEffect(() => {
    if (formData.end_at && !isManualTimeUpdate) {
      setDisplayEndTime(to12Hour(formData.end_at));
    }
  }, [formData.end_at, isManualTimeUpdate]);

  const renderStartTimeInput = () => {
    const incrementStartTime = () => {
      const timeParts = displayStartTime.split(':');
      const currentHours = parseInt(timeParts[0] || '0') || 0;
      const newHours = (currentHours + 1) % 24;
      const newTime = `${newHours.toString().padStart(2, '0')}:00 AM`;
      setDisplayStartTime(newTime);
      handleChange('start_at', `${newHours.toString().padStart(2, '0')}:00:00`);
    };

    const decrementStartTime = () => {
      const timeParts = displayStartTime.split(':');
      const currentHours = parseInt(timeParts[0] || '0') || 0;
      const newHours = currentHours - 1 < 0 ? 23 : currentHours - 1;
      const newTime = `${newHours.toString().padStart(2, '0')}:00 AM`;
      setDisplayStartTime(newTime);
      handleChange('start_at', `${newHours.toString().padStart(2, '0')}:00:00`);
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
        {errors.start_at && <p className="mt-1 text-base text-red-500">{errors.start_at}</p>}
      </div>
    );
  };

  const renderEndTimeInput = () => {
    const incrementEndTime = () => {
      const timeParts = displayEndTime.split(':');
      const currentHours = parseInt(timeParts[0] || '0') || 0;
      const newHours = (currentHours + 1) % 24;
      const newTime = `${newHours.toString().padStart(2, '0')}:00 AM`;
      setDisplayEndTime(newTime);
      handleChange('end_at', `${newHours.toString().padStart(2, '0')}:00:00`);
    };

    const decrementEndTime = () => {
      const timeParts = displayEndTime.split(':');
      const currentHours = parseInt(timeParts[0] || '0') || 0;
      const newHours = currentHours - 1 < 0 ? 23 : currentHours - 1;
      const newTime = `${newHours.toString().padStart(2, '0')}:00 AM`;
      setDisplayEndTime(newTime);
      handleChange('end_at', `${newHours.toString().padStart(2, '0')}:00:00`);
    };

    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">End time</label>
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
        {errors.end_at && <p className="mt-1 text-base text-red-500">{errors.end_at}</p>}
      </div>
    );
  };

  const renderManualForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Title, Assignment, Description */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Title
            </label>
            <FormInput
              id="title"
              value={formData.title}
              onChange={(value) => handleChange('title', value)}
              error={errors.title}
              required
              placeholder="Enter task title"
            />
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
                error={errors.assignment}
                required
                placeholder="Enter subject name"
                suggestions={uniqueAssignments}
              />
            </div>
          )}

          <div className="h-[200px] max-h-[200px]">
            <MarkdownWysiwyg
              initialTitle={formData.title}
              initialBody={formData.description}
              onChange={({ body }) => handleChange('description', body)}
              showTitleInput={false}
              variant="tasks"
              className="h-full max-h-full"
            />
            {errors.description && (
              <p className="mt-1 text-base text-red-500">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Right Column: All other fields */}
        <div className="space-y-4">
          <div className="space-y-4">
            {!formData.isRecurring ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderDifficultySelector()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
                  {renderDatePicker()}
                </div>
              </div>
            ) : (
              <div>
                {renderDifficultySelector()}
              </div>
            )}
            
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderStartTimeInput()}
                </div>
                <div>
                  {renderEndTimeInput()}
                </div>
              </div>
            </div>
          </div>

          <div>
            {renderRecurrenceSection()}
          </div>
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
  );

  const renderAIForm = () => (
    <div>
      <form className="flex flex-col h-full items-stretch justify-start space-y-3 sm:space-y-4" onSubmit={handleAISubmit}>
        {renderTabSelector(true)}

        <div className="w-full">
          <textarea
            id="aiPrompt"
            ref={aiTextareaRef}
            value={aiPrompt}
            onChange={e => {
              setAiPrompt(e.target.value);
              localStorage.setItem('aiPromptDraft', e.target.value);
            }}
            className="w-full min-h-[150px] sm:min-h-[120px] px-3 py-2 text-sm sm:text-base bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            placeholder="Example: Create tasks for: finish math worksheet by tomorrow (medium), study biology chapter 4 next Wednesday (hard), and write a short English essay this weekend (easy)."
            disabled={aiLoading}
          />
        </div>

        {aiError && <div className="text-red-500 text-xs sm:text-sm text-center">{aiError}</div>}
      </form>

      <div className="w-full mt-2 mb-4 md:mb-1">
        <button
          type="submit"
          onClick={aiLoading ? handleCancelAI : handleAISubmit}
          disabled={false}
          title={aiLoading ? "Click to cancel" : "Send"}
          className={`w-full px-4 py-2 border-2 rounded-lg font-medium transition-colors duration-200 text-base sm:text-lg shadow-none ${
            aiLoading 
              ? 'border-red-500 bg-transparent text-red-500 hover:text-red-600 focus:text-red-600' 
              : 'border-green-500 bg-transparent text-green-500 hover:bg-transparent hover:text-green-600 focus:bg-transparent focus:text-green-600 disabled:opacity-70'
          }`}
        >
          {aiLoading ? 'Cancel' : 'Send'}
        </button>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      maxWidth="max-w-4xl"
      showCloseButton={true}
    >
      {activeTab !== 'ai' && renderTabSelector(false)}
      {activeTab === 'manual' ? renderManualForm() : renderAIForm()}

      <AIPreviewModal
        isOpen={showAIPreview}
        tasks={aiParsedTasks || []}
        onAcceptAll={handleAIAcceptAll}
        onCancel={() => setShowAIPreview(false)}
      />
    </BaseModal>
  );
};

export default TaskForm;