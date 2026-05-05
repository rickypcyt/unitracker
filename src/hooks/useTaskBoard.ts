import { useCallback, useMemo } from 'react';
import { useFetchTasks, useTasksLoading, useUpdateTaskSuccess, useWorkspace, useWorkspaceActions } from '@/store/appStore';

import useDemoMode from '@/utils/useDemoMode';
import { useTaskManager } from '@/hooks/useTaskManager';

// Constant for the "All" workspace
export const ALL_WORKSPACE_ID = 'all';

export const useTaskBoard = () => {
  const tasksLoading = useTasksLoading();
  const updateTaskSuccess = useUpdateTaskSuccess();
  const fetchTasksAction = useFetchTasks();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  const { setCurrentWorkspace } = useWorkspaceActions();

  // Use demo mode hook instead of local state
  const { isDemo, demoTasks, loginPromptOpen, showLoginPrompt, closeLoginPrompt } = useDemoMode();

  const {
    tasks: realTasks,
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
  } = useTaskManager(activeWorkspace);

  // Create workspaces with "All" option
  const workspacesWithAll = useMemo(() => {
    const allWorkspace = {
      id: ALL_WORKSPACE_ID,
      name: 'All',
      icon: '📊',
      isAll: true
    };
    return [allWorkspace, ...(workspaces || [])];
  }, [workspaces]);

  // Use tasks demo si isDemo
  const tasks = isDemo
    ? demoTasks.filter(task => task.workspace_id === activeWorkspace?.id)
    : realTasks;

  // Update filteredTasks to handle "All" workspace
  const filteredTasks = useMemo(() => {
    if (!activeWorkspace || activeWorkspace.id === ALL_WORKSPACE_ID) {
      return tasks; // Show all tasks for "All" workspace
    }
    return tasks.filter(task => task.workspace_id === activeWorkspace.id);
  }, [tasks, activeWorkspace]);

  // Memoize completed and incompleted tasks
  const completedTasks = useMemo(() => filteredTasks.filter((task) => task.completed), [filteredTasks]);
  const incompletedTasks = useMemo(() => filteredTasks.filter((task) => !task.completed), [filteredTasks]);

  // Group incompleted tasks by assignment
  const incompletedByAssignment = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    incompletedTasks.forEach((task: any) => {
      const assignment = task.assignment || "No assignment";
      if (!grouped[assignment]) grouped[assignment] = [];
      grouped[assignment].push(task);
    });
    return grouped;
  }, [incompletedTasks]);

  // Handle delete all completed tasks
  const handleDeleteAllCompletedTasks = useCallback(() => {
    completedTasks.forEach((task: any) => originalHandleDeleteTask(task.id));
  }, [completedTasks, originalHandleDeleteTask]);

  // Handle delete assignment
  const handleDeleteAssignment = useCallback((assignment: string) => {
    const tasksToDelete = filteredTasks.filter(task => task.assignment === assignment);
    if (tasksToDelete.length > 0) {
      tasksToDelete.forEach(task => originalHandleDeleteTask(task.id));
    }
  }, [filteredTasks, originalHandleDeleteTask]);

  // Handle update assignment
  const handleUpdateAssignment = useCallback((oldName: string, newName: string) => {
    const tasksToUpdate = filteredTasks.filter(task => task.assignment === oldName);
    tasksToUpdate.forEach((task: any) => {
      handleUpdateTask({
        ...task,
        assignment: newName
      });
    });
  }, [filteredTasks, handleUpdateTask]);

  return {
    // State
    tasksLoading,
    activeWorkspace,
    workspaces: workspacesWithAll,
    tasks,
    filteredTasks,
    completedTasks,
    incompletedTasks,
    incompletedByAssignment,
    demoTasks,
    isDemo,
    loginPromptOpen,

    // Actions
    setCurrentWorkspace,
    showLoginPrompt,
    closeLoginPrompt,
    fetchTasksAction,
    updateTaskSuccess,

    // Task handlers
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
    handleDeleteAllCompletedTasks,
    handleDeleteAssignment,
    handleUpdateAssignment,
  };
};