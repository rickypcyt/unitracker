import { BookOpen, Check, Edit2, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDeleteTaskSuccess, useTasks, useUpdateTaskSuccess } from '@/store/appStore';

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
  const deleteTaskSuccess = useDeleteTaskSuccess();
  const updateTaskSuccess = useUpdateTaskSuccess();
  const { tasks } = useTasks();
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
      deleteTaskSuccess(task.id);
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
        updateTaskSuccess({
          ...task,
          assignment: newName
        });
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


  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        maxWidth="max-w-4xl"
        className="!p-0"
        showHeader={false}
      >
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <div className="relative flex items-center justify-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] text-center">
              Manage Assignments
            </h2>
            <button
              onClick={onClose}
              className="absolute right-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
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
                      className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all duration-300 cursor-pointer rounded-lg p-4 flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
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
                            <h3 className="font-semibold text-[var(--text-primary)] text-lg truncate">
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
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <span className="font-medium">{assignmentTasks.length} total</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">{pendingTasks.length} pending</span>
                          </div>
                          {completedTasks.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full"></div>
                              <span className="font-medium">{completedTasks.length} done</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteAssignment(assignment)}
                        className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                        title="Delete assignment and all its tasks"
                      >
                        <Trash2 size={18} />
                      </button>
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