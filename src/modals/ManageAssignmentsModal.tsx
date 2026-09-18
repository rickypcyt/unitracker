import { BookOpen, Check, Edit2, Trash2, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDeleteTaskSuccess, useTasks, useUpdateTaskSuccess } from '@/store/appStore';

import BaseModal from '@/modals/BaseModal';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import { getTaskStatusConfig } from '@/constants/taskStatus';
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

  // Pending: soonest deadline first, no deadline last
  const sortedPendingTasks = useMemo(() => {
    const getDeadline = (task: Task) => (task.deadline ?? (task as any).due_date ?? null) as string | null;
    return [...pendingTasks].sort((a, b) => {
      const da = getDeadline(a);
      const db = getDeadline(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return new Date(da).getTime() - new Date(db).getTime();
    });
  }, [pendingTasks]);

  // Completed: most recently completed first
  const sortedCompletedTasks = useMemo(
    () => [...completedTasks].sort(
      (a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime()
    ),
    [completedTasks]
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
        padding="none"
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
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="lg:w-2/5 space-y-2">
                  {assignments.map((assignment) => {
                    const assignmentTasks = tasks.filter((task: Task) => task.assignment === assignment);
                    const completedCount = assignmentTasks.filter((task: Task) => task.completed).length;
                    const pendingCount = assignmentTasks.length - completedCount;

                    const isSelected = selectedAssignment === assignment;

                    return (
                      <div
                        key={assignment}
                        className={`bg-[var(--bg-secondary)] border-2 ${
                          isSelected
                            ? 'border-[var(--accent-primary)] shadow-md shadow-[var(--accent-primary)]/10'
                            : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/60 hover:shadow-sm'
                        } transition-all duration-200 cursor-pointer rounded-xl p-3.5`}
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        {editingAssignment?.originalName === assignment ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="flex-1 min-w-0 bg-transparent border-b-2 border-[var(--accent-primary)] text-[var(--text-primary)] font-semibold focus:outline-none"
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
                              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              title="Save changes"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditing();
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="min-w-0 truncate font-semibold text-[var(--text-primary)]">
                                {assignment}
                              </h3>
                              <div className="flex flex-shrink-0 items-center gap-0.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(assignment);
                                  }}
                                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                                  title="Rename assignment"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAssignment(assignment);
                                  }}
                                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                  title="Delete assignment and all its tasks"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                              <span className="font-medium">{assignmentTasks.length} task{pluralize(assignmentTasks.length)}</span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                                {pendingCount} pending
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {completedCount} done
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="lg:w-3/5">
                  <div className="bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-xl p-4 sm:p-5 h-full min-h-[320px] flex flex-col">
                    {selectedAssignment ? (
                      <>
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                            {selectedAssignment}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {selectedAssignmentTasks.length} task{pluralize(selectedAssignmentTasks.length)} · {pendingTasks.length} pending · {completedTasks.length} done
                          </p>
                        </div>

                        <div className="space-y-5">
                          <section>
                            <header className="mb-2 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-primary)]">Pending</h4>
                              <span className="text-xs text-[var(--text-secondary)]">{pendingTasks.length}</span>
                            </header>
                            {pendingTasks.length === 0 ? (
                              <p className="text-sm text-[var(--text-secondary)]">No pending tasks. Nice!</p>
                            ) : (
                              <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {sortedPendingTasks.map((task) => {
                                  const dueLabel = formatDueDate(task);
                                  const statusCfg = task.status ? getTaskStatusConfig(task.status) : null;
                                  const showStatus = statusCfg && statusCfg.id !== 'todo';
                                  return (
                                    <li
                                      key={task.id}
                                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]/80 px-3 py-2"
                                    >
                                      <span className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">
                                        {task.title || 'Untitled task'}
                                      </span>
                                      <span className="flex flex-shrink-0 items-center gap-2 text-xs">
                                        {showStatus && (
                                          <span className={statusCfg.textColor}>{statusCfg.label}</span>
                                        )}
                                        {dueLabel && (
                                          <span className="font-medium text-[var(--accent-primary)] whitespace-nowrap">
                                            Due {dueLabel}
                                          </span>
                                        )}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </section>

                          <section>
                            <header className="mb-2 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Completed</h4>
                              <span className="text-xs text-[var(--text-secondary)]">{completedTasks.length}</span>
                            </header>
                            {completedTasks.length === 0 ? (
                              <p className="text-sm text-[var(--text-secondary)]">No completed tasks yet.</p>
                            ) : (
                              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {sortedCompletedTasks.map((task) => (
                                  <li
                                    key={task.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-primary)]/60 bg-[var(--bg-primary)]/40 px-3 py-2"
                                  >
                                    <span className="min-w-0 truncate text-sm text-[var(--text-secondary)] line-through">
                                      {task.title || 'Untitled task'}
                                    </span>
                                    {task.completed_at && (
                                      <span className="flex-shrink-0 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                        {new Date(task.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </section>
                        </div>
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