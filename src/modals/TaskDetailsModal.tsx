import { AlertCircle, Calendar, CheckCircle2, Circle, Clock, Play, Save, Tag, Trash2 } from "lucide-react";
import { FormActions, FormButton, FormInput } from "@/modals/FormElements";
import React, { useEffect } from "react";
import { useDeleteTaskSuccess, useUpdateTaskSuccess } from '@/store/appStore';

import BaseModal from "@/modals/BaseModal";
import MarkdownWysiwyg from '@/MarkdownWysiwyg';
import { Task } from '@/pages/tasks/task';
import moment from "moment";
import { toast } from "react-toastify";
import { useFormState } from "@/hooks/useFormState";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onSave?: (task: Task) => Promise<void>;
  onToggleCompletion?: (task: Task) => Promise<void>;
  onSetActiveTask?: (task: Task) => Promise<void>;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  onToggleCompletion,
  onSetActiveTask,
}) => {
  const updateTaskSuccess = useUpdateTaskSuccess();
  const deleteTaskSuccess = useDeleteTaskSuccess();

  const validationRules = {
    title: { required: true, minLength: 3, maxLength: 100 },
    description: { maxLength: 500 },
    due_date: { required: true },
    difficulty: { required: true },
    assignment: { required: true }
  };

  const {
    formData,
    errors,
    isDirty,
    handleChange,
    validateForm,
    setFormData
  } = useFormState(task || {
    id: '',
    title: '',
    completed: false,
    completed_at: null,
    description: '',
    created_at: '',
    updated_at: '',
    due_date: '',
    priority: 1,
    tags: [],
    user_id: '',
    activetask: false,
    difficulty: 'easy',
    assignment: ''
  }, validationRules) as unknown as {
    formData: Task;
    errors: Record<string, string>;
    isDirty: boolean;
    handleChange: (field: string, value: any) => void;
    validateForm: () => boolean;
    setFormData: (data: Task) => void;
  };

  useEffect(() => {
    if (task) {
      setFormData(task);
    }
  }, [task, setFormData]);

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (onSave) {
        await onSave(formData);
      } else {
        updateTaskSuccess(formData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task: " + (error as Error).message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTaskSuccess(task.id);
        onClose();
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task: " + (error as Error).message);
      }
    }
  };

  const handleToggleCompletion = async () => {
    try {
      if (onToggleCompletion) {
        await onToggleCompletion(task);
      } else {
        updateTaskSuccess({ ...task, completed: !task.completed });
      }
      onClose();
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast.error("Failed to update task status: " + (error as Error).message);
    }
  };

  const handleSetActiveTask = async () => {
    try {
      if (onSetActiveTask) {
        await onSetActiveTask({ ...task, activetask: !task.activetask });
      } else {
        updateTaskSuccess({ ...task, activetask: !task.activetask });
      }
      onClose();
    } catch (error) {
      console.error("Error setting active task:", error);
      toast.error("Failed to update task status: " + (error as Error).message);
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const getDifficultyColor = (difficulty: string) => {
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (isDirty) {
          if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            onClose();
          }
        } else {
          onClose();
        }
      }}
      title=""
      hasUnsavedChanges={false}
      maxWidth="max-w-3xl"
      className="!p-0"
      showHeader={false}
    >
      <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Task Details</h2>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                task.completed 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {task.completed ? 'Completed' : 'Pending'}
              </div>
              {task.activetask && (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Active
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Created {moment(task.created_at).fromNow()}</span>
            </div>
            {task.due_date && (
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Due {moment(task.due_date).fromNow()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-[var(--bg-primary)] rounded-xl p-5 border border-[var(--border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Tag size={18} className="text-[var(--accent-primary)]" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="assignment"
                label="Assignment"
                value={formData['assignment'] || ''}
                onChange={(value) => handleChange('assignment', value)}
                {...(errors['assignment'] && { error: errors['assignment'] })}
                required
              />

              <FormInput
                id="title"
                label="Title"
                value={formData['title'] || ''}
                onChange={(value) => handleChange('title', value)}
                {...(errors['title'] && { error: errors['title'] })}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-[var(--bg-primary)] rounded-xl p-5 border border-[var(--border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Description</h3>
            <MarkdownWysiwyg
              initialBody={formData.description || ''}
              onChange={({ body }) => handleChange('description', body)}
              className="min-h-[150px]"
            />
          </div>

          {/* Difficulty & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-primary)] rounded-xl p-5 border border-[var(--border-primary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-[var(--accent-primary)]" />
                Difficulty
              </h3>
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
                    {formData['difficulty'] === option.value ? (
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
            {errors['difficulty'] && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors['difficulty']}
              </p>
            )}
          </div>

          <div className="bg-[var(--bg-primary)] rounded-xl p-5 border border-[var(--border-primary)]">
            <FormInput
              id="deadline"
              label="Deadline"
              type="date"
              value={formData['due_date'] || ''}
              onChange={(value) => handleChange('due_date', value)}
              {...(errors['due_date'] && { error: errors['due_date'] })}
            />
          </div>
        </div>

        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <FormActions className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FormButton
            variant="danger"
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 w-full"
          >
            <Trash2 size={20} />
            <span>Delete</span>
          </FormButton>

          <FormButton
            variant="secondary"
            onClick={handleSetActiveTask}
            className="flex items-center justify-center gap-2 w-full"
          >
            <Play size={20} className={task.activetask ? "rotate-180" : ""} />
            <span>{task.activetask ? "Deactivate" : "Activate"}</span>
          </FormButton>

          <FormButton
            variant="secondary"
            onClick={handleToggleCompletion}
            className="flex items-center justify-center gap-2 w-full"
          >
            {task.completed ? (
              <>
                <Circle size={20} />
                <span>Incomplete</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>Complete</span>
              </>
            )}
          </FormButton>

          <FormButton
            variant="primary"
            onClick={handleSave}
            className="flex items-center justify-center gap-2 w-full"
          >
            <Save size={20} />
            <span>Save</span>
          </FormButton>
          </FormActions>
        </div>
      </div>
    </BaseModal>
  );
};

export default TaskDetailsModal;