import 'react-datepicker/dist/react-datepicker.css';
import '@/pages/calendar/datepicker-overrides.css';

import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { FormActions, FormButton, FormInput, FormSelect, FormTextarea } from '@/modals/FormElements';
import React, { useEffect, useRef, useState } from 'react';
import { addTaskSuccess, updateTaskSuccess } from '@/store/slices/TaskSlice';
import { useDispatch, useSelector } from 'react-redux';

import AutocompleteInput from '@/modals/AutocompleteInput';
import BaseModal from '@/modals/BaseModal';
import DatePicker from 'react-datepicker';
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
        activetask: initialTask?.activetask || false
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

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={initialTask ? 'Edit Task' : (initialAssignment ? `Add Task for ${initialAssignment}` : 'Add Task')}
      maxWidth="max-w-lg"
    >
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
        <FormTextarea
          id="description"
          value={formData.description}
          onChange={(value) => handleChange('description', value)}
          error={errors.description}
          placeholder="Enter task description"
        />

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
            variant="primary"
          >
            {initialTask ? 'Save Changes' : 'Add Task'}
          </FormButton>
        </FormActions>
      </form>
    </BaseModal>
  );
};

export default TaskForm;