import type { AppDispatch, RootState } from '@/store/store';
import { Check, ChevronLeft, ChevronRight, Clock, Edit2, Trash2, X } from 'lucide-react';
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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

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

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
  };

  const handleBackToMonths = () => {
    setSelectedMonth(null);
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
        title=""
        maxWidth="max-w-2xl"
        className="!p-0"
        showHeader={false}
      >
        <div className="space-y-4 p-6">
          <div className="relative flex items-center justify-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Manage Completed Tasks
            </h2>
            <button
              onClick={onClose}
              className="absolute right-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            {months.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-[var(--accent-primary)/10] rounded-full flex items-center justify-center mb-4">
                  <Check size={24} className="text-[var(--accent-primary)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No completed tasks</h3>
                <p className="text-[var(--text-secondary)]">
                  Completed tasks will appear here
                </p>
              </div>
            ) : selectedMonth ? (
              <div className="space-y-4">
                <button
                  onClick={handleBackToMonths}
                  className="flex items-center text-[var(--accent-primary)] hover:text-[var(--accent-primary-dark)] transition-colors mb-4"
                >
                  <ChevronLeft size={20} className="mr-1" />
                  Back to all months
                </button>
                
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                  {selectedMonth}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(groupedByMonth[selectedMonth] || [])
                    .slice()
                    .sort((a, b) => {
                      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
                      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
                      return dateB - dateA;
                    })
                    .map((task) => (
                            <div
                              key={task.id}
                              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-all duration-200 group"
                              onDoubleClick={() => handleEditTask(task)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                handleEditTask(task);
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-[var(--text-primary)] line-clamp-2">
                                  {task.title}
                                </h3>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTask(task);
                                    }}
                                    className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] rounded-md transition-colors"
                                    title="Edit task"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(task);
                                    }}
                                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                    title="Delete task"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-3">
                                <div className="flex items-center">
                                  <Clock size={14} className="mr-1.5" />
                                  <span>Completed {task.completed_at ? moment(task.completed_at).fromNow() : 'recently'}</span>
                                </div>
                              </div>
                              
                              {task.duration && (
                                <div className="mt-2 text-sm text-[var(--text-secondary)]">
                                  <span>Duration: {task.duration} min</span>
                                </div>
                              )}
                              
                              {task.description && (
                                <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  Select a month
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {months.map((month) => {
                    const tasksOfMonth = groupedByMonth[month] || [];
                    return (
                      <button
                        key={month}
                        onClick={() => handleMonthSelect(month)}
                        className="w-full text-left p-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[var(--text-primary)]">{month}</span>
                          <div className="flex items-center">
                            <span className="px-2.5 py-0.5 bg-[var(--accent-primary)/10] text-[var(--accent-primary)] text-sm rounded-full mr-2">
                              {tasksOfMonth.length} {tasksOfMonth.length === 1 ? 'task' : 'tasks'}
                            </span>
                            <ChevronRight size={18} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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