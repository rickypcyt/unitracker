import { BookOpen, Check, Edit2, Trash2, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDeleteTaskSuccess, useTasks, useUpdateTaskSuccess } from '@/store/appStore';

import BaseModal from '@/modals/BaseModal';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import type { Task } from '@/types/taskStorage';

const pluralize = (count: number, suffix: string = 's') => (count === 1 ? '' : suffix);

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
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  useEffect(() => {
    // Get unique assignments from tasks
    const uniqueAssignments = [...new Set(tasks.map((task: Task) => task.assignment || 'No Assignment'))]
      .filter((assignment): assignment is string => assignment !== 'No Assignment')
      .sort();
    setAssignments(uniqueAssignments);
    setSelectedAssignment((prev) => {
      if (prev && uniqueAssignments.includes(prev)) {
        return prev;
      }
      return uniqueAssignments[0] ?? null;
    });
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

  const selectedAssignmentTasks = useMemo(() => {
    if (!selectedAssignment) return [] as Task[];
    return tasks.filter((task: Task) => task.assignment === selectedAssignment);
  }, [selectedAssignment, tasks]);

  const pendingTasks = useMemo(
    () => selectedAssignmentTasks.filter((task: Task) => !task.completed),
    [selectedAssignmentTasks]
  );

  const completedTasks = useMemo(
    () => selectedAssignmentTasks.filter((task: Task) => task.completed),
    [selectedAssignmentTasks]
  );

  const formatDueDate = (task: Task) => {
    const source = (task.deadline ?? (task as any).due_date ?? null) as string | null;
    if (!source) return null;
    const parsed = new Date(source);
    if (Number.isNaN(parsed.valueOf())) return null;
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {assignments.map((assignment) => {
                      const assignmentTasks = tasks.filter((task: Task) => task.assignment === assignment);
                      const completedCount = assignmentTasks.filter((task: Task) => task.completed).length;
                      const pendingCount = assignmentTasks.length - completedCount;

                      const isSelected = selectedAssignment === assignment;

                      return (
                        <div
                          key={assignment}
                          className={`bg-[var(--bg-secondary)] border ${
                            isSelected
                              ? 'border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10'
                              : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:shadow-md'
                          } transition-all duration-300 cursor-pointer rounded-lg p-4 flex items-center gap-4`}
                          onClick={() => setSelectedAssignment(assignment)}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateAssignment(editingAssignment.originalName, editingAssignment.name);
                                    }}
                                    className="text-green-500 hover:text-green-400 p-1"
                                    title="Save changes"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelEditing();
                                    }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(assignment);
                                  }}
                                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                                  title="Edit assignment name"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <span className="font-medium">{assignmentTasks.length} total</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-medium">{pendingCount} pending</span>
                              </div>
                              {completedCount > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full"></div>
                                  <span className="font-medium">{completedCount} done</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssignment(assignment);
                            }}
                            className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                            title="Delete assignment and all its tasks"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:w-1/2">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-5 h-full min-h-[320px] space-y-6">
                    {selectedAssignment ? (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                            {selectedAssignment}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {selectedAssignmentTasks.length} task{pluralize(selectedAssignmentTasks.length)} in total · {pendingTasks.length} pending · {completedTasks.length} completed
                          </p>
                        </div>

                        <section className="space-y-3">
                          <header className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-green-400">Pending</h4>
                            <span className="text-xs text-[var(--text-secondary)]">{pendingTasks.length}</span>
                          </header>
                          {pendingTasks.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)]">No pending tasks for this assignment. Great job!</p>
                          ) : (
                            <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {pendingTasks.map((task) => {
                                const dueLabel = formatDueDate(task);
                                return (
                                  <li
                                    key={task.id}
                                    className="border border-[var(--border-primary)] rounded-md p-3 bg-[var(--bg-primary)]/80 hover:border-[var(--accent-primary)] transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-1">
                                        <p className="font-medium text-[var(--text-primary)] text-sm sm:text-base truncate">
                                          {task.title || 'Untitled task'}
                                        </p>
                                        {task.assignment && (
                                          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                            {task.assignment}
                                          </p>
                                        )}
                                        {task.status && (
                                          <p className="text-xs text-[var(--text-secondary)]">Status: {task.status}</p>
                                        )}
                                      </div>
                                      {dueLabel && (
                                        <span className="text-xs font-medium text-[var(--accent-primary)] whitespace-nowrap">
                                          Due {dueLabel}
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </section>

                        <section className="space-y-3">
                          <header className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Completed</h4>
                            <span className="text-xs text-[var(--text-secondary)]">{completedTasks.length}</span>
                          </header>
                          {completedTasks.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)]">No completed tasks yet. Keep going!</p>
                          ) : (
                            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {completedTasks.map((task) => {
                                const dueLabel = formatDueDate(task);
                                return (
                                  <li
                                    key={task.id}
                                    className="border border-[var(--border-primary)] rounded-md p-3 bg-[var(--bg-primary)]/50">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-1">
                                        <p className="font-medium text-[var(--text-secondary)] text-sm sm:text-base line-through truncate">
                                          {task.title || 'Untitled task'}
                                        </p>
                                        {task.completed_at && (
                                          <p className="text-xs text-[var(--text-secondary)]">
                                            Completed {new Date(task.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                          </p>
                                        )}
                                      </div>
                                      {dueLabel && (
                                        <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                          Due {dueLabel}
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </section>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-[var(--text-secondary)]">
                        <BookOpen size={32} />
                        <p className="text-sm">Select an assignment to view its tasks.</p>
                      </div>
                    )}
                  </div>
                </div>
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