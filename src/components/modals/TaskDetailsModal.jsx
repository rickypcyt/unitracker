import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X, Save, Trash2, Play, Circle, CheckCircle2 } from "lucide-react";
import moment from "moment";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { updateTask } from "../../redux/TaskActions";

const TaskDetailsModal = ({
  selectedTask,
  editedTask,
  isEditing,
  onClose,
  onEdit,
  onSave,
  onDelete,
  onToggleCompletion,
  onSetActiveTask,
  onEditChange,
}) => {
  const dispatch = useDispatch();

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isEditing) {
        onEdit(false);
      } else {
        onClose();
      }
    }
  };

  const handleSave = async () => {
    try {
      console.log("Edited Task before update:", editedTask);
      
      await onSave(editedTask);
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
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task: " + error.message);
    }
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose(); // Cierra el modal
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div 
        className="maincard max-w-2xl w-full mx-4 transform transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-center flex-1">
            Task Details
          </h3>
          <button
            className="text-gray-400 hover:text-white transition duration-200"
            onClick={onClose}
          >
            <X size={24} />
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
              <p className="text-text-secondary">{selectedTask.title}</p>
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
                {selectedTask.description || "No description"}
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
                    selectedTask.difficulty === "easy"
                      ? "text-green-500"
                      : selectedTask.difficulty === "medium"
                        ? "text-[var(--accent-primary)]"
                        : "text-red-500"
                  }`}
                >
                  {selectedTask.difficulty.charAt(0).toUpperCase() +
                    selectedTask.difficulty.slice(1)}
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
                  {selectedTask.assignment || "No assignment"}
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
                  {new Date(selectedTask.deadline).toLocaleDateString("en-US", {
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
                {moment(selectedTask.created_at).format("MMMM D, YYYY h:mm A")}
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
                {selectedTask.completed ? "Completed" : "Pending"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4 flex-wrap">
            <button
              onClick={() => onDelete(selectedTask.id)}
              className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
            >
              <Trash2 size={20} />
              Delete Task
            </button>

            {selectedTask.activetask ? (
              <button
                onClick={() =>
                  onSetActiveTask({ ...selectedTask, activetask: false })
                }
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
              >
                <Play size={20} className="rotate-180" />
                Deactivate Task
              </button>
            ) : (
              <button
                onClick={() =>
                  onSetActiveTask({ ...selectedTask, activetask: true })
                }
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
              >
                <Play size={20} />
                Set as Active Task
              </button>
            )}

            <button
              onClick={() => onToggleCompletion(selectedTask)}
              className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
            >
              {selectedTask.completed ? (
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
                onClick={() => onEdit(true)}
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