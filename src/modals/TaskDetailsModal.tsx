import { CheckCircle2, Circle, Play, Save, Trash2 } from "lucide-react";
import { FormActions, FormButton, FormInput } from "@/modals/FormElements";
import { deleteTask, updateTask } from "@/store/TaskActions";

import BaseModal from "@/modals/BaseModal";
import MarkdownWysiwyg from '@/MarkdownWysiwyg';
import moment from "moment";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { useFormState } from "@/hooks/useFormState";

const TaskDetailsModal = ({
  isOpen,
  onClose,
  task,
  onSave,
  onToggleCompletion,
  onSetActiveTask,
}) => {
  const dispatch = useDispatch();

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
    setFormData
  } = useFormState(task || {}, validationRules);

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
        await dispatch(updateTask(formData));
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await dispatch(deleteTask(task.id));
        onClose();
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task: " + error.message);
      }
    }
  };

  const handleToggleCompletion = async () => {
    try {
      if (onToggleCompletion) {
        await onToggleCompletion(task);
      } else {
        await dispatch(updateTask({ ...task, completed: !task.completed }));
      }
      onClose();
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast.error("Failed to update task status: " + error.message);
    }
  };

  const handleSetActiveTask = async () => {
    try {
      if (onSetActiveTask) {
        await onSetActiveTask({ ...task, activetask: !task.activetask });
      } else {
        await dispatch(updateTask({ ...task, activetask: !task.activetask }));
      }
      onClose();
    } catch (error) {
      console.error("Error setting active task:", error);
      toast.error("Failed to update task status: " + error.message);
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

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
      title="Task Details"
      hasUnsavedChanges={false}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="assignment"
            label="Assignment"
            value={formData.assignment}
            onChange={(value) => handleChange('assignment', value)}
            error={errors.assignment}
            required
          />

          <FormInput
            id="title"
            label="Title"
            value={formData.title}
            onChange={(value) => handleChange('title', value)}
            error={errors.title}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-base font-medium text-[var(--text-primary)]">
            Description
          </label>
          <MarkdownWysiwyg
            initialBody={formData.description}
            onChange={({ body }) => handleChange('description', body)}
            className="min-h-[200px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-[var(--text-primary)] mb-2">
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

          <FormInput
            id="deadline"
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(value) => handleChange('deadline', value)}
            error={errors.deadline}
          />
        </div>

        <div className="flex justify-between gap-8">
          <div className="flex-1 text-left">
            <h4 className="text-lg font-semibold text-neutral-500 mb-1">
              Created At
            </h4>
            <p className="text-gray">
              {moment(task.created_at).format("MMMM D, YYYY h:mm A")}
            </p>
          </div>

          <div className="flex-1 text-right">
            <h4 className="text-lg font-semibold text-neutral-500 mb-1">
              Status
            </h4>
            <p className="text-gray">
              {task.completed ? "Completed" : "Pending"}
            </p>
          </div>
        </div>

        <FormActions className="grid grid-cols-4 gap-2">
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
    </BaseModal>
  );
};

export default TaskDetailsModal;