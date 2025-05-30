import React, { useEffect } from "react";
import { Save, Trash2, Play, Circle, CheckCircle2 } from "lucide-react";
import moment from "moment";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { updateTask, deleteTask } from "../../store/actions/TaskActions";
import BaseModal from "../common/BaseModal";
import { FormInput, FormTextarea, FormSelect, FormButton, FormActions } from "../common/FormElements";
import { useFormState } from "../../hooks/useFormState";

const TaskDetailsModal = ({
  isOpen,
  onClose,
  task,
  onSave,
  onEditChange,
  editedTask,
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
  }, [task]);

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      hasUnsavedChanges={isDirty}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <FormInput
          id="title"
          label="Title"
          value={formData.title}
          onChange={(value) => handleChange('title', value)}
          error={errors.title}
          required
        />

        <FormTextarea
          id="description"
          label="Description"
          value={formData.description}
          onChange={(value) => handleChange('description', value)}
          error={errors.description}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormSelect
            id="difficulty"
            label="Difficulty"
            value={formData.difficulty}
            onChange={(value) => handleChange('difficulty', value)}
            options={difficultyOptions}
            error={errors.difficulty}
            required
          />

          <FormInput
            id="assignment"
            label="Assignment"
            value={formData.assignment}
            onChange={(value) => handleChange('assignment', value)}
            error={errors.assignment}
            required
          />

          <FormInput
            id="deadline"
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(value) => handleChange('deadline', value)}
            error={errors.deadline}
            required
          />
        </div>

        <div className="flex justify-between gap-8">
          <div className="flex-1 text-left">
            <h4 className="text-lg font-semibold text-text-primary mb-1">
              Created At
            </h4>
            <p className="text-text-secondary">
              {moment(task.created_at).format("MMMM D, YYYY h:mm A")}
            </p>
          </div>

          <div className="flex-1 text-right">
            <h4 className="text-lg font-semibold text-text-primary mb-1">
              Status
            </h4>
            <p className="text-text-secondary">
              {task.completed ? "Completed" : "Pending"}
            </p>
          </div>
        </div>

        <FormActions className="flex-wrap">
          <FormButton
            variant="danger"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 size={20} />
            Delete Task
          </FormButton>

          <FormButton
            variant="secondary"
            onClick={handleSetActiveTask}
            className="flex items-center gap-2"
          >
            <Play size={20} className={task.activetask ? "rotate-180" : ""} />
            {task.activetask ? "Deactivate Task" : "Set as Active Task"}
          </FormButton>

          <FormButton
            variant="secondary"
            onClick={handleToggleCompletion}
            className="flex items-center gap-2"
          >
            {task.completed ? (
              <>
                <Circle size={20} />
                Mark as Incomplete
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                Mark as Complete
              </>
            )}
          </FormButton>

          <FormButton
            variant="primary"
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save size={20} />
            Save Changes
          </FormButton>
        </FormActions>
      </div>
    </BaseModal>
  );
};

export default TaskDetailsModal;