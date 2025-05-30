import React, { useEffect } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useDispatch } from 'react-redux';
import { updateTaskSuccess, addTaskSuccess } from '../../store/slices/TaskSlice';
import { useFormState } from '../../hooks/useFormState';
import BaseModal from '../common/BaseModal';
import { FormInput, FormTextarea, FormSelect, FormButton, FormActions } from '../common/FormElements';
import { supabase } from '../../config/supabaseClient';

const TaskForm = ({ initialAssignment = null, initialTask = null, onClose, onTaskCreated }) => {
  const { user } = useTaskManager();
  const dispatch = useDispatch();

  const initialFormState = {
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    deadline: initialTask?.deadline || new Date().toISOString().split('T')[0],
    difficulty: initialTask?.difficulty || 'medium',
    assignment: initialTask?.assignment || initialAssignment || ''
  };

  const validationRules = {
    title: { required: true, minLength: 3, maxLength: 100 },
    description: { maxLength: 500 },
    deadline: { required: true },
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
      return;
    }

    try {
      const taskData = {
        ...formData,
        user_id: user.id,
        completed: initialTask?.completed || false,
        activetask: initialTask?.activetask || false
      };

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
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={initialTask ? 'Edit Task' : 'Add Task'}
      hasUnsavedChanges={isDirty}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          id="title"
          label="Title"
          value={formData.title}
          onChange={(value) => handleChange('title', value)}
          error={errors.title}
          required
          placeholder="Enter task title"
        />

        <FormTextarea
          id="description"
          label="Description"
          value={formData.description}
          onChange={(value) => handleChange('description', value)}
          error={errors.description}
          placeholder="Enter task description"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="deadline"
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(value) => handleChange('deadline', value)}
            error={errors.deadline}
            required
          />

          <FormSelect
            id="difficulty"
            label="Difficulty"
            value={formData.difficulty}
            onChange={(value) => handleChange('difficulty', value)}
            options={difficultyOptions}
            error={errors.difficulty}
            required
          />
        </div>

        <FormInput
          id="assignment"
          label="Assignment"
          value={formData.assignment}
          onChange={(value) => handleChange('assignment', value)}
          error={errors.assignment}
          required
          placeholder="Enter assignment name"
        />

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