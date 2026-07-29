import { BookOpen, ChevronRight, CircleDot, Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFetchTasks, useTasksOnly, useTasksLoading, useWorkspace } from '@/store/appStore';
import { ALL_WORKSPACE_ID } from '@/hooks/useTaskBoard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/navbar/NavigationContext';

import AddAssignmentModal from './AddAssignmentModal';
import LoginPromptModal from '@/modals/LoginPromptModal';
import TaskFormManager from '@/pages/tasks/TaskFormManager';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';

type AssignmentSummary = {
  name: string;
  total: number;
  completed: number;
  pending: number;
};

const AssignmentsOverview = () => {
  const tasks = useTasksOnly();
  const tasksLoading = useTasksLoading();
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const fetchTasks = useFetchTasks();
  const { isLoggedIn } = useAuth();
  const { navigateTo } = useNavigation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<string | null>(null);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const hasFetchedRef = useRef(false);

  // Fetch tasks on mount if not cached (avoids showing empty state before data loads)
  useEffect(() => {
    if (isLoggedIn && !tasksLoading && tasks.length === 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchTasks(activeWorkspace?.id);
    }
  }, [isLoggedIn, activeWorkspace?.id]);

  const assignments = useMemo<AssignmentSummary[]>(() => {
    const filtered = activeWorkspace && activeWorkspace.id !== ALL_WORKSPACE_ID
      ? tasks.filter(t => t.workspace_id === activeWorkspace.id)
      : tasks;

    const grouped: Record<string, { total: number; completed: number }> = {};
    filtered.forEach(task => {
      const name = task.assignment || 'No Assignment';
      if (!grouped[name]) grouped[name] = { total: 0, completed: 0 };
      grouped[name].total++;
      if (task.completed) grouped[name].completed++;
    });

    return Object.entries(grouped)
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        completed: stats.completed,
        pending: stats.total - stats.completed,
      }))
      .sort((a, b) => b.pending - a.pending || b.total - a.total);
  }, [tasks, activeWorkspace]);

  const handleAddClick = () => {
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true);
      return;
    }
    if (!workspaces || workspaces.length === 0) {
      setShowWorkspaceModal(true);
      return;
    }
    setShowAddModal(true);
  };

  const handleAddSubmit = (assignmentName: string) => {
    setShowAddModal(false);
    setPendingAssignment(assignmentName);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setPendingAssignment(null);
  };

  const handleWorkspaceCreated = () => {
    setShowWorkspaceModal(false);
    setShowAddModal(true);
  };

  const handleAssignmentClick = () => {
    navigateTo('tasks');
  };

  const totalAssignments = assignments.length;
  const totalPending = assignments.reduce((sum, a) => sum + a.pending, 0);

  const pendingTasks = useMemo(() => {
    const filtered = activeWorkspace && activeWorkspace.id !== ALL_WORKSPACE_ID
      ? tasks.filter(t => t.workspace_id === activeWorkspace.id && !t.completed)
      : tasks.filter(t => !t.completed);
    return filtered.slice(0, 6);
  }, [tasks, activeWorkspace]);

  return (
    <>
      <div
        className="w-full dashboard-noise-card"
        style={{ padding: 'clamp(0.75rem, 0.6rem + 0.6vw, 1.25rem)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--accent-primary)]" />
            <h2
              className="font-semibold text-[var(--text-primary)]"
              style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)' }}
            >
              Assignments
            </h2>
            {totalAssignments > 0 && (
              <span
                className="text-[var(--text-secondary)]"
                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
              >
                {totalAssignments} · {totalPending} pending
              </span>
            )}
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors"
            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>

        {tasksLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 size={24} className="text-[var(--accent-primary)] mb-2 animate-spin" />
            <p className="text-[var(--text-secondary)] text-sm">
              Loading assignments...
            </p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen size={32} className="text-[var(--text-secondary)] mb-2 opacity-50" />
            <p className="text-[var(--text-secondary)] text-sm">
              No assignments yet. Click "Add" to create one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {assignments.map(assignment => {
              const progressPct =
                assignment.total > 0
                  ? Math.round((assignment.completed / assignment.total) * 100)
                  : 0;

              return (
                <div
                  key={assignment.name}
                  onClick={() => handleAssignmentClick()}
                  className="group cursor-pointer bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3 hover:border-[var(--accent-primary)] hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="font-medium text-[var(--text-primary)] truncate"
                      style={{ fontSize: 'clamp(0.8rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                      title={assignment.name}
                    >
                      {assignment.name}
                    </h3>
                    <ChevronRight
                      size={16}
                      className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0"
                    />
                  </div>

                  <div className="flex items-center gap-3 mb-2" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.8125rem)' }}>
                    <span className="text-[var(--text-secondary)]">
                      {assignment.total} total
                    </span>
                    {assignment.pending > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-[var(--text-secondary)]">{assignment.pending} pending</span>
                      </span>
                    )}
                    {assignment.completed > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full" />
                        <span className="text-[var(--text-secondary)]">{assignment.completed} done</span>
                      </span>
                    )}
                  </div>

                  {assignment.total > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 bg-[var(--accent-primary)]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span
                        className="text-[var(--text-secondary)] flex-shrink-0"
                        style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.75rem)' }}
                      >
                        {progressPct}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Tasks */}
        <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-2 mb-3">
            <CircleDot size={16} className="text-[var(--accent-primary)]" />
            <h3
              className="font-medium text-[var(--text-primary)]"
              style={{ fontSize: 'clamp(0.8rem, 0.75rem + 0.2vw, 0.9375rem)' }}
            >
              Pending Tasks
            </h3>
            <span
              className="text-[var(--text-secondary)]"
              style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
            >
              {pendingTasks.length}
            </span>
          </div>

          {tasksLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={14} className="text-[var(--accent-primary)] animate-spin" />
              <p className="text-[var(--text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                Loading tasks...
              </p>
            </div>
          ) : pendingTasks.length === 0 ? (
            <p
              className="text-[var(--text-secondary)] py-2"
              style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
            >
              None — you're all caught up!
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => handleAssignmentClick()}
                  className="group cursor-pointer flex items-center gap-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 hover:border-[var(--accent-primary)] transition-all duration-200"
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] flex-shrink-0" />
                  <span
                    className="text-[var(--text-primary)] truncate flex-1"
                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                    title={task.title}
                  >
                    {task.title}
                  </span>
                  {task.assignment && (
                    <span
                      className="text-[var(--text-secondary)] flex-shrink-0 px-2 py-0.5 rounded bg-[var(--bg-primary)]"
                      style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.75rem)' }}
                    >
                      {task.assignment}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddAssignmentModal
          existingAssignments={assignments.map(a => a.name)}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {showTaskForm && (
        <TaskFormManager
          initialAssignment={pendingAssignment}
          onClose={handleCloseTaskForm}
          onTaskCreated={() => {
            fetchTasks(activeWorkspace?.id);
            handleCloseTaskForm();
          }}
        />
      )}

      {showWorkspaceModal && (
        <WorkspaceCreateModal
          isOpen={showWorkspaceModal}
          onClose={() => setShowWorkspaceModal(false)}
          onWorkspaceCreated={handleWorkspaceCreated}
        />
      )}

      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
      />
    </>
  );
};

export default AssignmentsOverview;
