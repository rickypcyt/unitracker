import 'react-datepicker/dist/react-datepicker.css';
import '@/pages/calendar/datepicker-overrides.css';

import { Calendar, CheckCircle2, Circle, X } from 'lucide-react';
import { FormActions, FormButton, FormInput } from '@/modals/FormElements';
import { addTaskSuccess, updateTaskSuccess } from '@/store/slices/TaskSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';

import AIPreviewModal from './AIPreviewModal';
import AutocompleteInput from '@/modals/AutocompleteInput';
import BaseModal from '@/modals/BaseModal';
import DatePicker from 'react-datepicker';
import MarkdownWysiwyg from '@/MarkdownWysiwyg';
import { addTask } from '@/store/TaskActions';
import { supabase } from '@/utils/supabaseClient';
import { useFormState } from '@/hooks/useFormState';
import { useTaskManager } from '@/hooks/useTaskManager';

const formatDateForInput = (date) => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDateForDB = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return null;
  return `${year}-${month}-${day}`;
};

const TaskForm = ({ initialAssignment = null, initialTask = null, initialDeadline = null, onClose, onTaskCreated }) => {
  const { user, tasks } = useTaskManager();

  const activeWorkspace = useSelector(state => state.workspace.activeWorkspace); // <-- Add this line
  const dispatch = useDispatch();
  // Allow dispatching thunks without TS friction in this component scope
  const anyDispatch = dispatch as any;
  const datePickerRef = useRef(null);
  const AI_DEBUG = import.meta.env['VITE_AI_DEBUG'] === 'true';

  const initialFormState = {
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    deadline: initialDeadline ? (typeof initialDeadline === 'string' ? initialDeadline : formatDateForInput(initialDeadline)) : (initialTask?.deadline ? formatDateForInput(new Date(initialTask.deadline)) : ''),
    difficulty: initialTask?.difficulty || 'medium',
    assignment: initialTask?.assignment || initialAssignment || ''
  };

  const validationRules = {
    title: { required: true, minLength: 3, maxLength: 100 },
    description: { maxLength: 500 },
    deadline: {
      required: false,
      validate: (value) => {
        if (!value) return true;
        const [day, month, year] = value.split('/');
        const date = new Date(`${year}-${month}-${day}`);
        if (isNaN(date.getTime()) || date < new Date(new Date().setHours(0,0,0,0))) {
          return 'Please enter a valid date in DD/MM/YYYY format that is not in the past';
        }
        return true;
      }
    },
    difficulty: { required: true },
    assignment: { required: true }
  };

  const {
    formData,
    errors,
    handleChange,
    validateForm
  } = useFormState(initialFormState, validationRules);

  useEffect(() => {
    if (initialAssignment) {
      handleChange('assignment', initialAssignment);
    }
  }, [initialAssignment, handleChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.warn('Validation errors:', errors);
      return;
    }
    try {
      const taskData = {
        ...formData,
        deadline: formData.deadline ? parseDateForDB(formData.deadline) : null,
        user_id: user.id,
        completed: initialTask?.completed || false,
        activetask: initialTask?.activetask || false,
        ...(initialTask ? {} : { workspace_id: activeWorkspace?.id || null }) // <-- Only set for new tasks
      };

      console.warn('Saving task data:', taskData);

      if (initialTask) {
        // Update existing task
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', initialTask.id)
          .select()
          .single();

        if (error) throw error;
        dispatch(updateTaskSuccess(data));
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (error) throw error;
        dispatch(addTaskSuccess(data));
        if (onTaskCreated) {
          onTaskCreated(data.id);
        }
        window.dispatchEvent(new CustomEvent('refreshTaskList'));
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-[#00FF41]'; 
      case 'medium':
        return 'text-[#1E90FF]'; 
      case 'hard':
        return 'text-[#FF003C]'; /* Neon red */
      default:
        return 'text-neutral-400';
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];
  // Control de cancelación y hover para el botón mientras genera
  const [aiAbortController, setAiAbortController] = useState<AbortController | null>(null);
  // Flag para saber si el usuario canceló y cortar también el post-procesado
  const aiCancelledRef = useRef(false);
  const [aiCancelHover, setAiCancelHover] = useState(false);

  const handleCancelAI = () => {
    aiCancelledRef.current = true;
    if (aiAbortController) {
      aiAbortController.abort();
    }
    setAiLoading(false);
    setAiAbortController(null);
  };

  const getSelectedDate = () => {
    if (!formData.deadline) return null;
    const parts = formData.deadline.split('/');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      if (!isNaN(date.getTime())) {
         return date;
      }
    }
    return null;
  };

  const uniqueAssignments = [...new Set(tasks.map((task) => task.assignment || 'No Assignment'))]
    .filter((assignment) => assignment && assignment !== 'No Assignment')
    .sort();

  const [activeTab, setActiveTab] = useState('ai'); // 'manual' or 'ai'
  const [aiPrompt, setAiPrompt] = useState(() => localStorage.getItem('aiPromptDraft') || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const aiTextareaRef = useRef(null);
  const [aiParsedTasks, setAiParsedTasks] = useState(null); // array|null
  const [showAIPreview, setShowAIPreview] = useState(false);
  // Modelo AI seleccionado por el usuario (persistido)
  const DEFAULT_MODEL = 'openai/gpt-oss-20b:free';
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem('aiSelectedModel');
    // Si había un valor legacy 'auto', usar el modelo por defecto
    return saved && saved !== 'auto' ? saved : DEFAULT_MODEL;
  });
  const MODEL_OPTIONS: { value: string; label: string }[] = [
    { value: 'openai/gpt-oss-20b:free', label: 'OpenAI: gpt-oss-20b (free)' },
    { value: 'deepseek/deepseek-chat-v3-0324:free', label: 'DeepSeek Chat v3 (free)' },
    { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B IT (free)' },
  ];

  useEffect(() => {
    localStorage.setItem('aiSelectedModel', selectedModel);
  }, [selectedModel]);

  // Ensure the Manual tab is active when editing an existing task
  useEffect(() => {
    if (initialTask) {
      setActiveTab('manual');
    }
  }, [initialTask]);

  // Autofocus AI textarea when the AI tab becomes active
  useEffect(() => {
    if (activeTab === 'ai' && aiTextareaRef.current) {
      try {
        aiTextareaRef.current.focus();
      } catch {}
    }
  }, [activeTab]);

  // Helper to call DeepSeek API
  async function handleAIPromptSubmit(e) {
    e.preventDefault();
    setAiError('');
    if (!aiPrompt.trim()) {
      setAiError('Prompt required');
      return;
    }
    setAiLoading(true);
    aiCancelledRef.current = false;
    // Limpia el draft solo si se envía
    // No borrar el input ni el draft al iniciar generación
    // Inicio y timer (debug)
    const tStart = (performance.now?.() ?? Date.now()) as number;
    let debugInterval: number | null = null;
    if (AI_DEBUG) {
      debugInterval = window.setInterval(() => {
        const nowTs = performance.now?.() ?? Date.now();
        const elapsedMs = (nowTs as number) - tStart;
        const secs = (elapsedMs / 1000).toFixed(1);
        const mins = (elapsedMs / 60000).toFixed(2);
        console.info(`[AI][elapsed] ${secs}s (~${mins}m)`);
      }, 1000);
    }
    // Preparar AbortController para poder cancelar
    const controller = new AbortController();
    setAiAbortController(controller);
    // Timeout de seguridad: si tarda demasiado, abortar
    const safetyTimeoutMs = 45000; // 45s
    const safetyTimeoutId = window.setTimeout(() => {
      try { controller.abort(); } catch {}
    }, safetyTimeoutMs);
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      // Obtén la fecha y zona horaria actual
      const now = new Date();
      const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const modelEnv = import.meta.env['VITE_OPENROUTER_MODEL'];
      const baseModels = [
        'openai/gpt-oss-20b:free',
        'deepseek/deepseek-chat-v3-0324:free',
        'google/gemma-2-9b-it:free',
      ];
      let modelCandidates: string[];
      const envList = modelEnv ? [String(modelEnv)] : [];
      if (selectedModel) {
        // Siempre incluir fallbacks después del modelo seleccionado
        modelCandidates = [selectedModel, ...envList, ...baseModels];
      } else {
        modelCandidates = [...envList, ...baseModels];
      }
      // Deduplicate while preserving order
      modelCandidates = modelCandidates.filter((m, i, arr) => arr.indexOf(m) === i);

      let data: any = null;
      let chosenModel: string | null = null;
      let lastErrorText = '';
      for (const model of modelCandidates) {
        if (AI_DEBUG) console.log('[AI][try-model]', model);
        const modelStart = performance.now?.() ?? Date.now();
        let response: Response;
        try {
          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': window.location.origin,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: `Hoy es ${currentDate} y la zona horaria del usuario es ${tz}. Extrae todas las tareas del siguiente texto y devuélvelas en un ARRAY JSON válido. Cada tarea debe tener: "task" (nombre), "description" (descripción corta), "date" (si el texto dice 'hoy', 'mañana', etc., calcula la fecha real según la fecha y zona horaria dadas y ponla en formato YYYY-MM-DD; si hay una fecha específica, ponla en formato YYYY-MM-DD; si no hay fecha, pon null), "subject" (si aplica), "difficulty" (easy, medium o hard; si no se menciona, pon medium). Devuelve SOLO el array JSON, sin texto extra, sin explicación, sin formato markdown. Ejemplo de salida: [{"task": "Hacer tarea de matemáticas", "description": "Resolver ejercicios de álgebra", "date": "YYYY-MM-DD", "subject": "matemáticas", "difficulty": "medium"}]` },
                { role: 'user', content: `Texto: "${aiPrompt}"` }
              ],
              temperature: 0.2,
              max_tokens: 1024,
              stream: false
            }),
            signal: controller.signal,
          });
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            if (AI_DEBUG) console.log('[AI] request aborted');
            if (debugInterval) window.clearInterval(debugInterval as number);
            setAiLoading(false);
            setAiAbortController(null);
            return;
          }
          throw err;
        }
        if (aiCancelledRef.current) {
          if (debugInterval) window.clearInterval(debugInterval as number);
          setAiLoading(false);
          setAiAbortController(null);
          return;
        }
        if (response.ok) {
          data = await response.json();
          chosenModel = model;
          if (AI_DEBUG) {
            const ms = (performance.now?.() ?? Date.now()) - (modelStart as number);
            console.log('[AI][model-elapsed]', model, `${Math.round(ms)}ms`, `~${(ms/1000).toFixed(2)}s`, `~${(ms/60000).toFixed(2)}m`);
          }
          break;
        } else {
          lastErrorText = await response.text();
          if (AI_DEBUG) {
            const ms = (performance.now?.() ?? Date.now()) - (modelStart as number);
            console.warn('[AI][model-failed]', model, `after ${Math.round(ms)}ms (~${(ms/1000).toFixed(2)}s, ~${(ms/60000).toFixed(2)}m)`, lastErrorText);
          }
        }
      }

      if (aiCancelledRef.current) {
        setAiLoading(false);
        setAiAbortController(null);
        return;
      }
      if (!data) {
        setAiError('AI request failed: ' + lastErrorText);
        setAiLoading(false);
        return;
      }
      const tAi = performance.now?.() ?? Date.now();
      if (AI_DEBUG) console.log('[AI][chosen-model]', chosenModel);
      if (AI_DEBUG) {
        const totalMs = (tAi - (tStart as number)) as number;
        console.log('[AI][latency]', `${Math.round(totalMs)}ms`, `~${(totalMs/1000).toFixed(2)}s`, `~${(totalMs/60000).toFixed(2)}m`);
      }
      if (AI_DEBUG) console.debug('[AI][raw-response]', data);
      // Limpia bloque markdown si existe y parsea con tolerancia
      // Extrae contenido de múltiples formas para compatibilidad con GPT-OSS y otros
      let content = '' as string;
      const choice0 = data?.choices?.[0];
      const msg = choice0?.message || {};
      // 1) contenido estándar
      if (typeof msg.content === 'string' && msg.content.trim()) {
        content = msg.content;
      }
      // 2) function/tool calls
      if (!content && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
        const arg = msg.tool_calls[0]?.function?.arguments;
        if (typeof arg === 'string' && arg.trim()) content = arg;
      }
      // 3) algunos modelos devuelven content como array de partes
      if (!content && Array.isArray(msg.content)) {
        const firstText = msg.content.find((p: any) => typeof p?.text === 'string' && p.text.trim());
        if (firstText?.text) content = firstText.text;
      }
      // 4) fallback genérico
      if (!content && typeof choice0?.text === 'string') {
        content = choice0.text;
      }
      if (!content) content = '';
      if (AI_DEBUG) console.debug('[AI][content-raw]', content);
      // 1) Intenta extraer un bloque entre ``` ``` si existe
      const fenceMatch = content.match(/```(?:json)?\r?\n([\s\S]*?)```/i);
      if (fenceMatch) {
        content = fenceMatch[1].trim();
        if (AI_DEBUG) console.debug('[AI][content-fenced]');
      } else {
        content = content.replace(/```json|```/gi, '').trim();
      }
      // Si tras limpiar fences y espacios no hay contenido, evita parsear vacío
      if (aiCancelledRef.current) {
        setAiLoading(false);
        setAiAbortController(null);
        return;
      }
      if (!content || !content.trim()) {
        if (AI_DEBUG) console.warn('[AI][empty-content-after-clean]', data);
        setAiError('AI returned empty content. Please try again or switch model.');
        setAiLoading(false);
        setAiAbortController(null);
        return;
      }
      // Función de ayuda para quitar comas colgantes y comillas raras
      const normalizeJsonLike = (txt: string) => {
        return txt
          // comillas inteligentes a comillas normales
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'")
          // comas finales antes de ] o }
          .replace(/,(\s*[}\]])/g, '$1')
          .trim();
      };
      // Extrae un bloque balanceado empezando en el primer open ([' or '{')
      const extractBalanced = (txt: string, open: string, close: string) => {
        const start = txt.indexOf(open);
        if (start === -1) return '';
        let depth = 0;
        for (let i = start; i < txt.length; i++) {
          const ch = txt[i];
          if (ch === open) depth++;
          else if (ch === close) {
            depth--;
            if (depth === 0) {
              return txt.slice(start, i + 1);
            }
          }
        }
        // No encontramos cierre, devolvemos desde start hasta fin (truncado)
        return txt.slice(start);
      };
      const tryAutoClose = (candidate: string, closeChar: ']' | '}') => {
        let c = candidate;
        // Intenta cerrar una vez
        if (!c.trim().endsWith(closeChar)) c = c + closeChar;
        try { return JSON.parse(normalizeJsonLike(c)); } catch {}
        // Intenta cerrar dos veces por si hay dos niveles abiertos
        c = c + closeChar;
        try { return JSON.parse(normalizeJsonLike(c)); } catch {}
        return null;
      };
      const tryParse = (txt: string) => {
        const norm = normalizeJsonLike(txt);
        if (AI_DEBUG) console.debug('[AI][parse-attempt] len=', norm.length);
        return JSON.parse(norm);
      };
      if (aiCancelledRef.current) {
        setAiLoading(false);
        setAiAbortController(null);
        return;
      }
      let parsed: any = null;
      // Attempt 1: parse directo
      try {
        parsed = tryParse(content);
      } catch (e1) {
        if (AI_DEBUG) console.warn('[AI][parse-fail-1]', e1);
        // Attempt 2: extraer array [ ... ]
        // Primero intenta extraer de forma balanceada el array
        const candidateBalancedArray = extractBalanced(content, '[', ']');
        if (parsed == null && candidateBalancedArray) {
          const candidate = candidateBalancedArray;
          try {
            parsed = tryParse(candidate);
            if (AI_DEBUG) console.debug('[AI][parse-success-array]');
          } catch (e2) {
            if (AI_DEBUG) console.warn('[AI][parse-fail-array]', e2);
            // Si el error es de fin inesperado, intenta autocerrar
            const auto = tryAutoClose(candidate, ']');
            if (auto != null) {
              parsed = auto;
              if (AI_DEBUG) console.debug('[AI][parse-success-array-autoclose]');
            }
          }
        }
        // Attempt 3: extraer objeto { ... }
        if (parsed == null) {
          const candidateObj = extractBalanced(content, '{', '}');
          if (candidateObj) {
            try {
              const obj = tryParse(candidateObj);
              if (obj && Array.isArray(obj.tasks)) {
                parsed = obj.tasks;
                if (AI_DEBUG) console.debug('[AI][parse-success-object.tasks]');
              } else {
                parsed = obj; // si es un objeto único, lo tratamos como una entrada
                if (AI_DEBUG) console.debug('[AI][parse-success-object]');
              }
            } catch (e3) {
              if (AI_DEBUG) console.warn('[AI][parse-fail-object]', e3);
              // Autocierre si está truncado
              const autoObj = tryAutoClose(candidateObj, '}');
              if (autoObj != null) {
                if (Array.isArray(autoObj?.tasks)) {
                  parsed = autoObj.tasks;
                } else {
                  parsed = autoObj;
                }
                if (AI_DEBUG) console.debug('[AI][parse-success-object-autoclose]');
              }
            }
          }
        }
        // Attempt 4 (último recurso): convertir comillas simples a dobles si parece JSON con comillas simples
        if (parsed == null) {
          const looksSingleJson = /'\s*[:\]]|:\s*'/.test(content) || (content.includes("'") && !content.includes('"'));
          if (looksSingleJson) {
            const singleToDouble = content.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
            try {
              parsed = tryParse(singleToDouble);
              if (AI_DEBUG) console.debug('[AI][parse-success-single-quotes]');
            } catch (e4) {
              if (AI_DEBUG) console.warn('[AI][parse-fail-single-quotes]', e4);
            }
          }
        }
        if (parsed == null) {
          setAiError('Could not parse AI response. Raw content: ' + content);
          setAiLoading(false);
          return;
        }
      }
      // Si es objeto, conviértelo en array
      const tasksArr = Array.isArray(parsed) ? parsed : [parsed];
      if (AI_DEBUG) console.log('[AI][parsed-tasks-count]', tasksArr.length);
      if (AI_DEBUG) console.debug('[AI][parsed-tasks]', tasksArr);
      if (aiCancelledRef.current) {
        setAiLoading(false);
        setAiAbortController(null);
        return;
      }
      setAiParsedTasks(tasksArr);
      setShowAIPreview(true);
      setAiLoading(false);
      setAiAbortController(null);
      // No rellenes el form aún, espera a que el usuario acepte
    } catch (err) {
      setAiError('Error: ' + (err.message || err));
      setAiLoading(false);
      if (AI_DEBUG) {
        const errMs = (performance.now?.() ?? Date.now()) as number - tStart;
        console.warn('[AI][error-elapsed]', `${Math.round(errMs)}ms`, `~${(errMs/1000).toFixed(2)}s`, `~${(errMs/60000).toFixed(2)}m`);
      }
    } finally {
      if (AI_DEBUG && debugInterval) window.clearInterval(debugInterval);
      window.clearTimeout(safetyTimeoutId);
      setAiAbortController(null);
    }
  }

  // Permite cancelar con tecla Escape mientras está generando
  useEffect(() => {
    if (!aiLoading) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelAI();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aiLoading]);

  // Valida formato YYYY-MM-DD
  function isValidDate(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  // Convierte fechas relativas comunes a YYYY-MM-DD y valida formato
  function normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    const lower = dateStr.toLowerCase().trim();

    // Hoy
    if (lower === 'hoy' || lower === 'today') {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Mañana
    if (lower === 'mañana' || lower === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Pasado mañana
    if (lower === 'pasado mañana' || lower === 'day after tomorrow') {
      const dat = new Date();
      dat.setDate(dat.getDate() + 2);
      const year = dat.getFullYear();
      const month = String(dat.getMonth() + 1).padStart(2, '0');
      const day = String(dat.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Próxima semana
    if (
      lower === 'próxima semana' ||
      lower === 'la próxima semana' ||
      lower === 'next week' ||
      lower === 'the next week'
    ) {
      const dat = new Date();
      dat.setDate(dat.getDate() + 7);
      const year = dat.getFullYear();
      const month = String(dat.getMonth() + 1).padStart(2, '0');
      const day = String(dat.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Si ya es una fecha válida, la devuelve igual
    if (isValidDate(dateStr)) return dateStr;

    // Si no es válida, devuelve vacío
    return '';
  }

  // Convierte YYYY-MM-DD a DD/MM/YYYY
  function ymdToDmy(dateStr) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  // Limpia el draft al cerrar el modal completamente
  useEffect(() => {
    if (!showAIPreview && activeTab === 'ai' && !aiLoading && !aiError) {
      // No limpiar draft aquí, solo cuando se envía o manualmente
    }
  }, [showAIPreview, activeTab, aiLoading, aiError]);

  // Compute modal title once to reuse in headers
  const modalTitle = initialTask ? 'Edit Task' : (initialAssignment ? `Add Task for ${initialAssignment}` : 'Add Task');

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      maxWidth="max-w-lg"
      showCloseButton={false}
    >
      {/* Header for Manual mode with title and close (above AI | Manual selector) */}
      {activeTab === 'manual' && (
        <div className="w-full max-w-md mx-auto flex items-center justify-between pt-5 sm:pt-0">
          <label className="text-base font-bold text-[var(--text-primary)]">Add Task Manual</label>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {/* Simple text selector for Manual | AI (directly under title, only for Manual tab) */}
      {activeTab !== 'ai' && (
        <div className="w-full max-w-lg mx-auto flex justify-center items-center gap-3 mt-2 sm:mt-3 pt-5 sm:pt-4 mb-3 sm:mb-6 select-none">
          <span
            className={`cursor-pointer font-semibold transition-colors duration-150 ${activeTab === 'ai' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}
            onClick={() => setActiveTab('ai')}
          >
            AI
          </span>
          <span className="text-[var(--border-primary)] font-bold">|</span>
          <span
            className={`cursor-pointer font-semibold transition-colors duration-150 ${activeTab === 'manual' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}
            onClick={() => setActiveTab('manual')}
          >
            Manual
          </span>
        </div>
      )}
      {/* Tab Content */}
      {activeTab === 'manual' ? (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className={`grid ${initialAssignment ? 'grid-cols-1' : 'grid-cols-2'} gap-3 sm:gap-4`}>
            {!initialAssignment && (
              <div>
                <label htmlFor="assignment" className="block text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 text-left">
                  Assignment
                </label>
                <AutocompleteInput
                  id="assignment"
                  value={formData.assignment}
                  onChange={(value) => handleChange('assignment', value)}
                  error={errors.assignment}
                  required
                  placeholder="Enter assignment name"
                  suggestions={uniqueAssignments}
                />
              </div>
            )}
            <div>
              <label htmlFor="title" className="block text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 text-left">
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
          </div>

          <label htmlFor="description" className="block text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 text-left">
            Description
          </label>
          <MarkdownWysiwyg
            initialTitle={formData.title}
            initialBody={formData.description}
            onChange={({ body }) => handleChange('description', body)}
            showTitleInput={false}
            className=""
          />
          {errors.description && (
            <p className="mt-1 text-base text-red-500">{errors.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 ">
            <div>
              <label className="block text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 text-left">
                Difficulty
              </label>
              <div className="flex items-center justify-center gap-4 sm:gap-8">
                {difficultyOptions.map((option) => (
                  <div key={option.value} className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleChange('difficulty', option.value)}
                      className="p-1 rounded-full transition-all duration-200 hover:scale-110 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleChange('difficulty', option.value);
                        }
                      }}
                    >
                      {formData.difficulty === option.value ? (
                        <CheckCircle2
                          size={22}
                          className={getDifficultyColor(option.value)}
                        />
                      ) : (
                        <Circle
                          size={22}
                          className={getDifficultyColor(option.value)}
                        />
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

            <div>
              <label htmlFor="deadline" className="block text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 text-left">
                Deadline
              </label>
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
                      className={`w-full pl-3 pr-16 py-2 bg-[var(--bg-primary)] border-2 ${
                        errors.deadline ? 'border-red-500' : 'border-[var(--border-primary)]'
                      } rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] focus:border-2px`}
                    />
                  }
                  minDate={new Date()}
                  popperPlacement="bottom-start"
                  calendarClassName="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg text-[var(--text-primary)]"
                  dayClassName={(date) =>
                    date.getDay() === 0 || date.getDay() === 6 ? 'text-red-500' : undefined
                  }
                  showPopperArrow={false}
                />
                <button
                  type="button"
                  onClick={() => handleChange('deadline', '')}
                  className="absolute right-10 top-0 bottom-0 w-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 cursor-pointer"
                  tabIndex={-1}
                  title="Clear deadline"
                  style={{ zIndex: 2 }}
                >
                  <span className="text-xl font-bold">×</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (datePickerRef.current) {
                      datePickerRef.current.setOpen(true);
                    }
                  }}
                  className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  <Calendar size={20} />
                </button>
              </div>
              {errors.deadline && (
                <p className="mt-1 text-base text-red-500">{errors.deadline}</p>
              )}
            </div>
          </div>

          <FormActions>
            <FormButton
              type="button"
              variant="secondary"
              onClick={onClose}
            >
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
      ) : (
        <form className="flex flex-col h-full flex-1 items-stretch justify-start space-y-4" onSubmit={handleAIPromptSubmit}>
          {/* Header row with title and close (top-right) */}
          <div className="w-full max-w-md flex items-center justify-between pt-5 sm:pt-0">
            <label htmlFor="aiPrompt" className="text-base font-bold text-[var(--text-primary)]">
              Write a prompt for making a new task:
            </label>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              title="Close"
              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={18} />
            </button>
          </div>
          {/* AI | Manual toggle under the AI header */}
          <div className="w-full max-w-md flex justify-center items-center gap-3 mt-1 sm:mt-2 pt-4 sm:pt-2 select-none">
            <span
              className={`cursor-pointer font-semibold transition-colors duration-150 ${activeTab === 'ai' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}
              onClick={() => setActiveTab('ai')}
            >
              AI
            </span>
            <span className="text-[var(--border-primary)] font-bold">|</span>
            <span
              className={`cursor-pointer font-semibold transition-colors duration-150 ${activeTab === 'manual' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}
              onClick={() => setActiveTab('manual')}
            >
              Manual
            </span>
          </div>
          <textarea
            id="aiPrompt"
            ref={aiTextareaRef}
            value={aiPrompt}
            onChange={e => {
              setAiPrompt(e.target.value);
              localStorage.setItem('aiPromptDraft', e.target.value);
            }}
            className="w-full min-h-[120px] max-w-md px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            placeholder="Describe the task you want AI to generate..."
            disabled={aiLoading}
          />
          {aiError && <div className="text-red-500 text-sm text-center">{aiError}</div>}
          {/* Helper texts centered on small screens, above footer */}
          <div className="w-full max-w-md text-sm text-[var(--text-secondary)] text-center sm:text-left -mt-1">
            Example: "Create tasks for: finish math worksheet by tomorrow (medium), study biology chapter 4 next Wednesday (hard), and write a short English essay this weekend (easy)."
          </div>
          <div className="w-full max-w-md text-xs text-[var(--text-secondary)] text-center sm:text-left mt-1">
            Tip: you can write dates like "today", "tomorrow", "next Wednesday", or explicit dates such as "2025-09-30" or "30/09/2025"; they will be normalized to YYYY-MM-DD.
          </div>
          {/* Footer-like controls: sticky at bottom on mobile, normal on desktop */}
          <div className="w-full max-w-md mt-auto pt-2 sm:pt-3 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex items-center justify-start gap-2 mb-2 sticky bottom-0 sm:static">
            <select
              id="aiModel"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              disabled={aiLoading}
            >
              {MODEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FormButton
              type={aiLoading ? 'button' : 'submit'}
              variant="custom"
              onMouseEnter={() => setAiCancelHover(true)}
              onMouseLeave={() => setAiCancelHover(false)}
              onClick={aiLoading ? handleCancelAI : undefined}
              className={
                aiLoading && aiCancelHover
                  ? 'border border-[var(--icon-color,var(--accent-primary))] bg-transparent text-[var(--icon-color,var(--accent-primary))] shadow-none hover:bg-transparent focus:bg-transparent'
                  : 'border border-[var(--icon-color,var(--accent-primary))] bg-transparent text-[var(--icon-color,var(--accent-primary))] shadow-none hover:bg-transparent hover:text-[var(--icon-color,var(--accent-primary))] focus:bg-transparent focus:text-[var(--icon-color,var(--accent-primary))]'
              }
            >
              {aiLoading ? 'Cancel' : 'Send'}
            </FormButton>
          </div>
        </form>
      )}
      {/* AI Preview Modal */}
      <AIPreviewModal
        isOpen={showAIPreview}
        tasks={aiParsedTasks || []}
        onAccept={async (task: any) => {
          const t0 = performance.now?.() ?? Date.now();
          // Mapea los datos de la tarea AI a los campos de la base de datos
          const normalizedDate = task.date && task.date !== 'null' ? normalizeDate(task.date) : null;
          const newTask = {
            title: task.task || '',
            description: task.description || (task.subject ? `Asignatura: ${task.subject}` : ''),
            assignment: task.subject || '',
            deadline: normalizedDate || null, // null si no hay fecha
            difficulty: task.difficulty || 'medium',
          };
          if (AI_DEBUG) console.log('[AI][accept-one][mapped]', newTask);
          await anyDispatch(addTask(newTask));
          const t1 = performance.now?.() ?? Date.now();
          if (AI_DEBUG) console.log('[AI][accept-one][duration-ms]', Math.round((t1 - t0) as number));
          setShowAIPreview(false);
          // Cerrar el modal principal después de aceptar
          onClose();
        }}
        onCancel={() => {
          setShowAIPreview(false);
        }}
      />
    </BaseModal>
  );
};

export default TaskForm;