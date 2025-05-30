import React, { useEffect, useState } from "react";
import { X, Save, Trash2, Play, Circle, CheckCircle2 } from "lucide-react";
import moment from "moment";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { updateTask, deleteTask } from "../../store/actions/TaskActions";

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
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Verificación de seguridad
  if (!isOpen || !task) return null;

  useEffect(() => {
    // Resetear el estado de edición y cambios sin guardar cuando se abre el modal
    if (isOpen) {
      setIsEditing(false);
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Detectar cambios sin guardar
    if (isEditing && editedTask) {
      const hasChanges = Object.keys(editedTask).some(key => {
        if (key === 'created_at') return false; // Ignorar cambios en created_at
        return editedTask[key] !== task[key];
      });
      setHasUnsavedChanges(hasChanges);
    }
  }, [editedTask, task, isEditing]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setIsEditing(false);
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      setIsEditing(false);
      setHasUnsavedChanges(false);
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSave = async () => {
    try {
      console.log("Edited Task before update:", editedTask);
      
      await onSave(editedTask);
      setIsEditing(false);
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task: " + error.message);
    }
  };

  const handleEditChange = (field, value) => {
    onEditChange(field, value);
  };

  const handleSaveEdit = async () => {
    try {
      await dispatch(updateTask(editedTask));
      setIsEditing(false);
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task: " + error.message);
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

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, hasUnsavedChanges]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? "Edit Task" : "Task Details"}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 ">
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">
              Title
            </h4>
            {isEditing ? (
              <input
                type="text"
                value={editedTask?.title || ""}
                onChange={(e) => handleEditChange("title", e.target.value)}
                className="textinput w-full"
              />
            ) : (
              <p className="text-text-secondary">{task.title}</p>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">
              Description
            </h4>
            {isEditing ? (
              <textarea
                value={editedTask?.description || ""}
                onChange={(e) => handleEditChange("description", e.target.value)}
                className="textinput w-full"
                rows="4"
              />
            ) : (
              <p className="text-text-secondary whitespace-pre-wrap">
                {task.description || "No description"}
              </p>            )}
          </div>

          {/* Grouped Inputs */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Difficulty */}
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Difficulty
              </h4>
              {isEditing ? (
                <select
                  value={editedTask?.difficulty || "easy"}
                  onChange={(e) => handleEditChange("difficulty", e.target.value)}
                  className="textinput w-full h-[60%]"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              ) : (
                <p
                  className={`text-text-secondary ${
                    task.difficulty === "easy"
                      ? "text-green-500"
                      : task.difficulty === "medium"
                        ? "text-[var(--accent-primary)]"
                        : "text-red-500"
                  }`}
                >
                  {task.difficulty.charAt(0).toUpperCase() +
                    task.difficulty.slice(1)}
                </p>
              )}
            </div>

            {/* Assignment */}
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Assignment
              </h4>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask?.assignment || ""}
                  onChange={(e) => handleEditChange("assignment", e.target.value)}
                  className="textinput w-full"
                  placeholder="Enter assignment name"
                />
              ) : (
                <p className="text-text-secondary">
                  {task.assignment || "No assignment"}
                </p>
              )}
            </div>

            {/* Deadline */}
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Deadline
              </h4>
              {isEditing ? (
                <input
                  type="date"
                  value={editedTask?.deadline || ""}
                  onChange={(e) => handleEditChange("deadline", e.target.value)}
                  className="textinput w-full"
                />
              ) : (
                <p className="text-text-secondary">
                  {new Date(task.deadline).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-8">
            {/* Created At */}
            <div className="flex-1 text-left">
              <h4 className="text-lg font-semibold text-text-primary mb-1">
                Created At
              </h4>
              <p className="text-text-secondary">
                {moment(task.created_at).format("MMMM D, YYYY h:mm A")}
              </p>
            </div>

            {/* Status */}
            <div
              className="flex-1 text-right
            "
            >
              <h4 className="text-lg font-semibold text-text-primary mb-1">
                Status
              </h4>
              <p className="text-text-secondary">
                {task.completed ? "Completed" : "Pending"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4 flex-wrap">
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
            >
              <Trash2 size={20} />
              Delete Task
            </button>

            {task.activetask ? (
              <button
                onClick={handleSetActiveTask}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
              >
                <Play size={20} className="rotate-180" />
                Deactivate Task
              </button>
            ) : (
              <button
                onClick={handleSetActiveTask}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
              >
                <Play size={20} />
                Set as Active Task
              </button>
            )}

            <button
              onClick={handleToggleCompletion}
              className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
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
            </button>

            {isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="text-green-500 hover:text-green-600 transition-colors duration-200 flex items-center gap-2"
              >
                <Save size={20} />
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors duration-200 flex items-center gap-2"
              >
                Edit Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;