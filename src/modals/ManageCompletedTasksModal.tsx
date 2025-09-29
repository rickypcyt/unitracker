import type { AppDispatch, RootState } from '@/store/store';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BaseModal from '@/modals/BaseModal';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import TaskDetailsModal from '@/modals/TaskDetailsModal';
import type { Task } from '@/pages/tasks/taskStorage';
import { deleteTask, updateTask } from '@/store/TaskActions';
import moment from 'moment';

interface ManageCompletedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageCompletedTasksModal: React.FC<ManageCompletedTasksModalProps> = ({
  isOpen,
  onClose,
  onEditTask,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [openMonths, setOpenMonths] = useState<string[]>([]);

  // Agrupar tareas completadas por mes
  const completedTasks = tasks.filter((t: Task) => t.completed);
  const groupedByMonth: { [month: string]: Task[] } = {};
  completedTasks.forEach((task) => {
    const month = task.completed_at
      ? moment(task.completed_at).format('MMMM YYYY')
      : 'Unknown';
    if (!groupedByMonth[month]) groupedByMonth[month] = [];
    (groupedByMonth[month] as Task[]).push(task);
  });
  const months = Object.keys(groupedByMonth).sort((a, b) => moment(b, 'MMMM YYYY').valueOf() - moment(a, 'MMMM YYYY').valueOf());

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    dispatch(deleteTask(taskToDelete.id));
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    try {
      await dispatch(updateTask(updatedTask) as any);
      setTaskToEdit(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const toggleMonth = (month: string) => {
    setOpenMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month]
    );
  };

  if (!isOpen) return null;

  // Handle task completion toggle
  const handleToggleCompletion = async (task: Task) => {
    try {
      await dispatch(updateTask({ ...task, completed: !task.completed }) as any);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // Handle setting active task
  const handleSetActiveTask = async (task: Task) => {
    try {
      await dispatch(updateTask({ ...task, activetask: !task.activetask }) as any);
    } catch (error) {
      console.error('Error setting active task:', error);
    }
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Completed Tasks"
        maxWidth="max-w-2xl"
        className="!p-0"
      >
        <div className="space-y-4 p-6">
          {months.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-4">
              No completed tasks found
            </p>
          ) : (
            <div className="space-y-6">
              {months.map((month) => {
                // Ordenar tareas de más reciente a más antiguo
                const tasksOfMonth = (groupedByMonth[month] || []).slice().sort((a, b) => {
                  const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
                  const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
                  return dateB - dateA;
                });
                return (
                  <div key={month}>
                    <button
                      className="w-full flex items-center justify-between font-bold text-lg text-[var(--accent-primary)] mb-2 px-2 py-2 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                      onClick={() => toggleMonth(month)}
                      type="button"
                    >
                      <span>{month} ({tasksOfMonth.length})</span>
                      {openMonths.includes(month) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    {openMonths.includes(month) && (
                      <div className="max-h-[60vh] overflow-y-auto divide-y divide-[var(--border-primary)] bg-[var(--bg-secondary)] rounded-lg">
                        {tasksOfMonth.map((task, idx) => {
                          // Enumerar: 1 = más antiguo, n = más nuevo
                          const number = tasksOfMonth.length - idx;
                          return (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 group cursor-pointer"
                              onDoubleClick={() => handleEditTask(task)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                handleEditTask(task);
                              }}
                            >
                              <div>
                                <h3 className="font-medium text-[var(--text-primary)]">
                                  <span className="text-[var(--accent-primary)] mr-2">{number}.</span>{task.title}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">Completed: {task.completed_at ? moment(task.completed_at).format('LLL') : 'Unknown'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTask(task);
                                  }}
                                  className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                  title="Edit task"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task);
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </BaseModal>

      {showDeleteModal && taskToDelete && (
        <DeleteCompletedModal
          onClose={() => {
            setShowDeleteModal(false);
            setTaskToDelete(null);
          }}
          onConfirm={confirmDeleteTask}
          message={`Are you sure you want to delete the task "${taskToDelete.title}"? This action cannot be undone.`}
          confirmButtonText="Delete Task"
        />
      )}

      {taskToEdit && (
        <TaskDetailsModal
          isOpen={!!taskToEdit}
          onClose={() => setTaskToEdit(null)}
          task={taskToEdit}
          onSave={handleSaveTask}
          onToggleCompletion={handleToggleCompletion}
          onSetActiveTask={handleSetActiveTask}
        />
      )}
    </>
  );
};

export default ManageCompletedTasksModal; 