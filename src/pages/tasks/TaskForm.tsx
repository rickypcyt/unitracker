import 'react-datepicker/dist/react-datepicker.css';
import '@/pages/calendar/datepicker-overrides.css';

import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { FormActions, FormButton, FormInput } from '@/modals/FormElements';
import { formatDateForInput, getSelectedDateFromDMY, normalizeNaturalOrYMDDate } from '@/hooks/tasks/useTaskDateUtils';
import { useEffect, useRef } from 'react';

import AIPreviewModal from './AIPreviewModal';
import AutocompleteInput from '@/modals/AutocompleteInput';
import BaseModal from '@/modals/BaseModal';
import DatePicker from 'react-datepicker';
import MarkdownWysiwyg from '@/MarkdownWysiwyg';
import { addTask } from '@/store/TaskActions';
import { useFormState } from '@/hooks/useFormState';
import { useTaskAI } from '@/hooks/tasks/useTaskAI';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useTaskSubmit } from '@/hooks/tasks/useTaskSubmit';
import { useWorkspace } from '@/store/appStore';

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
  { value: 'medium', label: 'Medium', color: 'text-[#1E90FF]' },
  { value: 'hard', label: 'Hard', color: 'text-[#FF003C]' }
] as const;

const TaskForm = ({ 
  initialAssignment = null, 
  initialTask = null, 
  initialDeadline = null, 
  onClose, 
  onTaskCreated 
}: TaskFormProps) => {
  const { user, tasks } = useTaskManager();
  const { saveTask } = useTaskSubmit();
  const workspace = useWorkspace();
  const activeWorkspace = workspace.currentWorkspace;
  const datePickerRef = useRef<any>(null);

  const typedUser = user as any;

  // Form State
  const initialFormState = {
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    deadline: getInitialDeadline(),
    difficulty: initialTask?.difficulty || 'medium',
    assignment: initialTask?.assignment || initialAssignment || ''
  };

  const validationRules = {
    title: { required: true, minLength: 3, maxLength: 100 },
    description: { maxLength: 500 },
    deadline: {
      required: false,
      validate: validateDeadline
    },
    difficulty: { required: true },
    assignment: { required: true }
  };

  const { formData, errors, handleChange, validateForm } = useFormState(
    initialFormState as any, 
    validationRules as any
  ) as any;

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
    
    if (!validateForm()) {
      console.warn('Validation errors:', errors);
      return;
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
          // Handle DD/MM/YYYY format
          const [day, month, year] = date.split('/');
          if (day && month && year) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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

    const safetyTimeoutId = window.setTimeout(() => {
      controller.abort();
    }, 45000);

    try {
      const result = await callAIAPI(controller);
      
      if (aiCancelledRef.current) return;
      
      if (!result?.success) {
        setAiError(result?.error || 'AI request failed');
        return;
      }

      const tasksArr = Array.isArray(result.data) ? result.data : [result.data];
      
      if (AI_DEBUG) {
        console.log('[AI][parsed-tasks-count]', tasksArr.length);
        console.debug('[AI][parsed-tasks]', tasksArr);
      }

      setAiParsedTasks(tasksArr);
      setShowAIPreview(true);
    } catch (err) {
      setAiError('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (debugInterval) clearInterval(debugInterval);
      clearTimeout(safetyTimeoutId);
      setAiLoading(false);
      setAiAbortController(null);
    }
  };

  
  const handleAIAcceptAll = async (tasks: any[]) => {
    const mappedTasks = tasks.map(mapAITaskToFormData);
    if (AI_DEBUG) console.log('[AI][accept-all][count]', mappedTasks.length);
    
    await Promise.all(mappedTasks.map(addTask));
    setShowAIPreview(false);
    onClose();
  };

  // Helper Functions
  function getInitialDeadline(): string {
    if (initialDeadline) {
      return typeof initialDeadline === 'string' 
        ? initialDeadline 
        : formatDateForInput(initialDeadline);
    }
    if (initialTask?.deadline) {
      return formatDateForInput(new Date(initialTask.deadline));
    }
    return '';
  }

  function validateDeadline(value: string): true | string {
    if (!value) return true;
    
    const [day, month, year] = value.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    
    return isNaN(date.getTime()) 
      ? 'Please enter a valid date in DD/MM/YYYY format'
      : true;
  }

  
  function mapAITaskToFormData(task: any) {
    const normalizedDate = task.date && task.date !== 'null' 
      ? normalizeNaturalOrYMDDate(task.date) 
      : null;

    return {
      title: task.task || '',
      description: task.description || (task.subject ? `Asignatura: ${task.subject}` : ''),
      assignment: task.subject || '',
      deadline: normalizedDate,
      difficulty: task.difficulty || 'medium',
    };
  }

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

  const getSelectedDate = () => getSelectedDateFromDMY(formData.deadline);

  // Render Components
  const renderTabSelector = (isAIActive: boolean) => (
    <div className="w-full max-w-md flex justify-center items-center gap-2 sm:gap-3 mt-1 pt-2 select-none mb-4 sm:mb-4">
      <span
        className={`cursor-pointer font-semibold transition-colors duration-150 text-sm sm:text-base ${
          isAIActive 
            ? 'text-[var(--accent-primary)]' 
            : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'
        }`}
        onClick={() => setActiveTab('ai')}
      >
        AI
      </span>
      <span className="text-[var(--border-primary)] font-bold text-sm sm:text-base">|</span>
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
    </div>
  );

  const renderDifficultySelector = () => (
    <div>
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        {DIFFICULTY_OPTIONS.map((option) => (
          <div key={option.value} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => handleChange('difficulty', option.value)}
              className="p-1 rounded-full transition-all duration-200 hover:scale-110"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleChange('difficulty', option.value);
                }
              }}
            >
              {formData.difficulty === option.value ? (
                <CheckCircle2 size={22} className={option.color} />
              ) : (
                <Circle size={22} className={option.color} />
              )}
            </button>
            <span className="text-base text-[var(--text-primary)]">{option.label}</span>
          </div>
        ))}
      </div>
      {errors.difficulty && (
        <p className="mt-1 text-base text-red-500">{errors.difficulty}</p>
      )}
    </div>
  );

  const renderDatePicker = () => (
    <div>
      <div className="relative flex items-center">
        <DatePicker
          id="deadline"
          ref={datePickerRef}
          selected={getSelectedDate()}
          onChange={(date) => handleChange('deadline', formatDateForInput(date))}
          dateFormat="dd/MM/yyyy"
          placeholderText="DD/MM/YYYY"
          customInput={
            <input
              type="text"
              readOnly
              value={formData.deadline || 'None'}
              className={`w-full pl-3 pr-20 py-2 bg-[var(--bg-primary)] border-2 ${
                errors.deadline ? 'border-red-500' : 'border-[var(--border-primary)]'
              } rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]`}
            />
          }
          popperPlacement="bottom-start"
          calendarClassName="bg-[var(--bg-primary)] border-2 border-[var(--accent-primary)] rounded-lg shadow-lg text-[var(--text-primary)]"
          dayClassName={(date) =>
            date.getDay() === 0 || date.getDay() === 6 ? 'text-red-500' : ''
          }
          showPopperArrow={false}
        />
        <button
          type="button"
          onClick={() => handleChange('deadline', '')}
          className="absolute right-12 top-0 bottom-0 w-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 cursor-pointer"
          tabIndex={-1}
          title="Clear deadline"
          style={{ zIndex: 2 }}
        >
          <span className="text-xl font-bold">×</span>
        </button>
        <button
          type="button"
          onClick={() => datePickerRef.current?.setOpen(true)}
          className="absolute right-2 top-0 bottom-0 w-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          tabIndex={-1}
        >
          <Calendar size={20} />
        </button>
      </div>
      {errors.deadline && (
        <p className="mt-1 text-base text-red-500">{errors.deadline}</p>
      )}
    </div>
  );

  const renderManualForm = () => (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div>
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
        <div className="mb-2">
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

      <MarkdownWysiwyg
        initialTitle={formData.title}
        initialBody={formData.description}
        onChange={({ body }) => handleChange('description', body)}
        showTitleInput={false}
        className="pb-2"
        placeholder="Describe your task in detail (supports markdown formatting)"
      />
      {errors.description && (
        <p className="mt-1 text-base text-red-500">{errors.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pb-4">
        {renderDifficultySelector()}
        {renderDatePicker()}
      </div>

      <FormActions>
        <FormButton type="button" variant="secondary" onClick={onClose}>
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
      maxWidth="max-w-lg"
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