import React from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Play, Circle, CheckCircle2 } from 'lucide-react';
import moment from 'moment';

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
  onEditChange
}) => {
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
    await onSave();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="maincard max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
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

        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">Title</h4>
            {isEditing ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => onEditChange('title', e.target.value)}
                className="textinput w-full"
              />
            ) : (
              <p className="text-text-secondary">{selectedTask.title}</p>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">Description</h4>
            {isEditing ? (
              <textarea
                value={editedTask.description || ''}
                onChange={(e) => onEditChange('description', e.target.value)}
                className="textinput w-full"
                rows="4"
              />
            ) : (
              <p className="text-text-secondary whitespace-pre-wrap">{selectedTask.description || 'No description'}</p>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">Status</h4>
            <p className="text-text-secondary">
              {selectedTask.completed ? 'Completed' : 'Pending'}
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">Difficulty</h4>
            {isEditing ? (
              <select
                value={editedTask.difficulty}
                onChange={(e) => onEditChange('difficulty', e.target.value)}
                className="textinput w-full"
              >
                <option value="easy" className="text-green-500">Easy</option>
                <option value="medium" className="text-blue-500">Medium</option>
                <option value="hard" className="text-red-500">Hard</option>
              </select>
            ) : (
              <p className={`text-text-secondary ${selectedTask.difficulty === 'easy' ? 'text-green-500' :
                selectedTask.difficulty === 'medium' ? 'text-blue-500' :
                  'text-red-500'
                }`}>
                {selectedTask.difficulty.charAt(0).toUpperCase() + selectedTask.difficulty.slice(1)}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">Assignment</h4>
            {isEditing ? (
              <input
                type="text"
                value={editedTask.assignment || ''}
                onChange={(e) => onEditChange('assignment', e.target.value)}
                className="textinput w-full"
                placeholder="Enter assignment name"
              />
            ) : (
              <p className="text-text-secondary">
                {selectedTask.assignment || 'No assignment'}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">Deadline</h4>
            {isEditing ? (
              <input
                type="date"
                value={editedTask.deadline}
                onChange={(e) => onEditChange('deadline', e.target.value)}
                className="textinput w-full"
              />
            ) : (
              <p className="text-text-secondary">
                {new Date(selectedTask.deadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">Created At</h4>
            <p className="text-text-secondary">
              {moment(selectedTask.created_at).format('MMMM D, YYYY h:mm A')}
            </p>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => onDelete(selectedTask.id)}
              className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
            >
              <Trash2 size={20} />
              Delete Task
            </button>
            {selectedTask.activetask ? (
              <button
                onClick={() => onSetActiveTask({ ...selectedTask, activetask: false })}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
              >
                <Play size={20} className="rotate-180" />
                Deactivate Task
              </button>
            ) : (
              <button
                onClick={() => onSetActiveTask({ ...selectedTask, activetask: true })}
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
                onClick={handleSave}
                className="text-green-500 hover:text-green-600 transition-colors duration-200 flex items-center gap-2"
              >
                <Save size={20} />
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => onEdit(true)}
                className="text-blue-500 hover:text-blue-600 transition-colors duration-200 flex items-center gap-2"
              >
                Edit Task
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskDetailsModal; 