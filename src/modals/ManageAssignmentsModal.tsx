import type { AppDispatch, RootState } from '@/store/store';
import { BookOpen, Check, Edit2, Trash2, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { deleteTask, updateTask } from '@/store/TaskActions';
import { useDispatch, useSelector } from 'react-redux';

import BaseModal from '@/modals/BaseModal';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import type { Task } from '@/pages/tasks/taskStorage';

interface ManageAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageAssignmentsModal: React.FC<ManageAssignmentsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [assignments, setAssignments] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<{name: string, originalName: string} | null>(null);

  useEffect(() => {
    // Get unique assignments from tasks
    const uniqueAssignments = [...new Set(tasks.map((task: Task) => task.assignment || 'No Assignment'))]
      .filter((assignment): assignment is string => assignment !== 'No Assignment')
      .sort();
    setAssignments(uniqueAssignments);
  }, [tasks]);

  const handleDeleteAssignment = (assignment: string) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  const confirmDeleteAssignment = () => {
    if (!assignmentToDelete) return;

    // Delete all tasks associated with this assignment
    const tasksToDelete = tasks.filter((task: Task) => task.assignment === assignmentToDelete);
    tasksToDelete.forEach((task: Task) => {
      dispatch(deleteTask(task.id));
    });

    setShowDeleteModal(false);
    setAssignmentToDelete(null);
  };

  const handleUpdateAssignment = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingAssignment(null);
      return;
    }

    // Update all tasks with the old assignment name
    tasks.forEach((task: Task) => {
      if (task.assignment === oldName) {
        dispatch(updateTask({
          ...task,
          assignment: newName
        }));
      }
    });

    setEditingAssignment(null);
  };

  const startEditing = (assignment: string) => {
    setEditingAssignment({ name: assignment, originalName: assignment });
  };

  const cancelEditing = () => {
    setEditingAssignment(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Assignments"
        maxWidth="max-w-4xl"
        className="!p-0"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
              <p className="text-[var(--text-secondary)] text-lg">No assignments found</p>
              <p className="text-[var(--text-secondary)] mt-2">Create tasks with assignments to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment) => {
                const assignmentTasks = tasks.filter((task: Task) => task.assignment === assignment);
                const completedTasks = assignmentTasks.filter((task: Task) => task.completed);
                const pendingTasks = assignmentTasks.filter((task: Task) => !task.completed);

                return (
                  <div
                    key={assignment}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 hover:bg-[var(--bg-primary)] transition-colors duration-200 min-h-[120px]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {editingAssignment?.originalName === assignment ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                className="flex-1 bg-transparent border-b border-[var(--accent-primary)] text-[var(--text-primary)] focus:outline-none"
                                value={editingAssignment.name}
                                onChange={(e) => setEditingAssignment({...editingAssignment, name: e.target.value})}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateAssignment(editingAssignment.originalName, editingAssignment.name);
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                                autoFocus
                              />
                              <button 
                                onClick={() => handleUpdateAssignment(editingAssignment.originalName, editingAssignment.name)}
                                className="text-green-500 hover:text-green-400 p-1"
                                title="Save changes"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={cancelEditing}
                                className="text-red-500 hover:text-red-400 p-1"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                              {assignment}
                            </h3>
                          )}
                          {editingAssignment?.originalName !== assignment && (
                            <button
                              onClick={() => startEditing(assignment)}
                              className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                              title="Edit assignment name"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{assignmentTasks.length} total</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{pendingTasks.length} pending</span>
                          </div>
                          {completedTasks.length > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full"></div>
                              <span>{completedTasks.length} done</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAssignment(assignment)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                        title="Delete assignment and all its tasks"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Progress bar */}
                    {assignmentTasks.length > 0 && (
                      <div className="w-full bg-[var(--bg-primary)] rounded-full h-2 mb-2">
                        <div
                          className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(completedTasks.length / assignmentTasks.length) * 100}%` }}
                        ></div>
                      </div>
                    )}

                    {/* Task preview */}
                    {assignmentTasks.length > 0 && (
                      <div className="text-sm text-[var(--text-secondary)]">
                        {pendingTasks.length > 0 && (
                          <div className="mb-1">
                            <span className="text-green-500 font-medium">Next:</span> {pendingTasks[0].title}
                          </div>
                        )}
                        {assignmentTasks.length > 3 && (
                          <div className="text-[var(--text-secondary)]">
                            +{assignmentTasks.length - 3} more tasks
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </BaseModal>

      {showDeleteModal && assignmentToDelete && (
        <DeleteCompletedModal
          onClose={() => {
            setShowDeleteModal(false);
            setAssignmentToDelete(null);
          }}
          onConfirm={confirmDeleteAssignment}
          message={`Are you sure you want to delete the assignment "${assignmentToDelete}"? All tasks associated with this assignment will be deleted.`}
          confirmButtonText="Delete Assignment"
        />
      )}
    </>
  );
};

export default ManageAssignmentsModal; 