import 'react-datepicker/dist/react-datepicker.css';
import '@/pages/calendar/datepicker-overrides.css';

import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { FormActions, FormButton, FormInput, FormSelect, FormTextarea } from '@/modals/FormElements';
import React, { useEffect, useRef, useState } from 'react';
import { addTaskSuccess, updateTaskSuccess } from '@/store/slices/TaskSlice';
import { useDispatch, useSelector } from 'react-redux';

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
  const assignments = useSelector(state => state.assignments.list);
  const activeWorkspace = useSelector(state => state.workspace.activeWorkspace); // <-- Add this line
  const dispatch = useDispatch();
  const datePickerRef = useRef(null);

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
    isDirty,
    handleChange,
    validateForm,
    resetForm
  } = useFormState(initialFormState, validationRules);

  useEffect(() => {
    if (initialAssignment) {
      handleChange('assignment', initialAssignment);
    }
  }, [initialAssignment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('Validation errors:', errors);
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

      console.log('Saving task data:', taskData);

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
          .insert([{ ...taskData, activetask: true }])
          .select()
          .single();

        if (error) throw error;
        dispatch(addTaskSuccess(data));
        if (onTaskCreated) {
          onTaskCreated(data.id);
        }
        // Dispara evento global para refrescar la lista
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
        return 'text-[#00FF41]'; /* Matrix green */
      case 'medium':
        return 'text-[#1E90FF]'; /* Electric neon blue */
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

  // Helper to call DeepSeek API
  async function handleAIPromptSubmit(e) {
    e.preventDefault();
    setAiError('');
    if (!aiPrompt.trim()) {
      setAiError('Prompt required');
      return;
    }
    setAiLoading(true);
    // Limpia el draft solo si se envía
    localStorage.removeItem('aiPromptDraft');
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      // Obtén la fecha y zona horaria actual
      const now = new Date();
      const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: [
            { role: 'system', content: `Hoy es ${currentDate} y la zona horaria del usuario es ${tz}. Extrae todas las tareas del siguiente texto y devuélvelas en un ARRAY JSON válido. Cada tarea debe tener: "task" (nombre), "description" (descripción corta), "date" (si el texto dice 'hoy', 'mañana', etc., calcula la fecha real según la fecha y zona horaria dadas y ponla en formato YYYY-MM-DD; si hay una fecha específica, ponla en formato YYYY-MM-DD; si no hay fecha, pon null), "subject" (si aplica), "difficulty" (easy, medium o hard; si no se menciona, pon medium). Devuelve SOLO el array JSON, sin texto extra, sin explicación, sin formato markdown. Ejemplo de salida: [{"task": "Hacer tarea de matemáticas", "description": "Resolver ejercicios de álgebra", "date": "YYYY-MM-DD", "subject": "matemáticas", "difficulty": "medium"}]` },
            { role: 'user', content: `Texto: "${aiPrompt}"` }
          ],
          max_tokens: 256,
          stream: false
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        setAiError('AI request failed: ' + response.status + ' ' + errorText);
        setAiLoading(false);
        return;
      }
      const data = await response.json();
      console.log('AI response:', data); // Debug log
      // Limpia bloque markdown si existe
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json|```/g, '').trim();
      let parsed = null;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        setAiError('Could not parse AI response. Raw content: ' + content);
        setAiLoading(false);
        return;
      }
      // Si es objeto, conviértelo en array
      const tasksArr = Array.isArray(parsed) ? parsed : [parsed];
      setAiParsedTasks(tasksArr);
      setShowAIPreview(true);
      setAiLoading(false);
      // No rellenes el form aún, espera a que el usuario acepte
    } catch (err) {
      setAiError('Error: ' + (err.message || err));
      setAiLoading(false);
    }
  }

  // Valida formato YYYY-MM-DD
  function isValidDate(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  // Convierte fechas relativas comunes a YYYY-MM-DD y valida formato
  function normalizeDate(dateStr) {
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

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={initialTask ? 'Edit Task' : (initialAssignment ? `Add Task for ${initialAssignment}` : 'Add Task')}
      maxWidth="max-w-lg"
    >
      {/* Simple text selector for Manual | AI */}
      <div className="flex justify-center items-center gap-2 mb-6 select-none">
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
      {/* Tab Content */}
      {activeTab === 'manual' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`grid gap-4 ${initialAssignment ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {!initialAssignment && (
              <div>
                <label htmlFor="assignment" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
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
              <label htmlFor="title" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
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

          <label htmlFor="description" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
            Description
          </label>
          <MarkdownWysiwyg
            initialTitle={formData.title}
            initialBody={formData.description}
            onChange={({ body }) => handleChange('description', body)}
            className=""
          />
          {errors.description && (
            <p className="mt-1 text-base text-red-500">{errors.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div>
              <label className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
                Difficulty
              </label>
              <div className="flex items-center justify-center gap-8">
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
              <label htmlFor="deadline" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
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
        <form className="space-y-4 flex flex-col items-center justify-center" onSubmit={handleAIPromptSubmit}>
          <label htmlFor="aiPrompt" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
            Write a prompt for making a new task:
          </label>
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
          <FormActions>
            <FormButton
              type="submit"
              variant="custom"
              className="border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]"
              disabled={aiLoading}
            >
              {aiLoading ? 'Generating...' : 'Send'}
            </FormButton>
          </FormActions>
        </form>
      )}
      {/* AI Preview Modal */}
      <AIPreviewModal
        isOpen={showAIPreview}
        tasks={aiParsedTasks || []}
        onAccept={async task => {
          // Mapea los datos de la tarea AI a los campos de la base de datos
          const normalizedDate = task.date && task.date !== 'null' ? normalizeDate(task.date) : null;
          const newTask = {
            title: task.task || '',
            description: task.description || (task.subject ? `Asignatura: ${task.subject}` : ''),
            assignment: task.subject || '',
            deadline: normalizedDate || null, // null si no hay fecha
            difficulty: task.difficulty || 'medium',
          };
          await dispatch(addTask(newTask));
          setShowAIPreview(false);
          setActiveTab('manual');
          // Opcional: resetea el formulario manual
          resetForm && resetForm();
        }}
        onEdit={task => {
          handleChange('title', task.task || '');
          handleChange('description', task.description || (task.subject ? `Asignatura: ${task.subject}` : ''));
          handleChange('assignment', task.subject || '');
          handleChange('deadline', task.date && task.date !== 'null' ? ymdToDmy(normalizeDate(task.date)) : '');
          handleChange('difficulty', task.difficulty || 'medium');
          setShowAIPreview(false);
          setActiveTab('manual');
        }}
        onCancel={() => {
          setShowAIPreview(false);
        }}
      />
    </BaseModal>
  );
};

export default TaskForm;