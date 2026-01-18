import { useCallback, useMemo, useState } from 'react';
import { useFetchTasks, useTasksLoading, useUpdateTaskSuccess, useWorkspace, useWorkspaceActions } from '@/store/appStore';

import { useTaskManager } from '@/hooks/useTaskManager';

export const useTaskBoard = () => {
  const tasksLoading = useTasksLoading();
  const updateTaskSuccess = useUpdateTaskSuccess();
  const fetchTasksAction = useFetchTasks();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  const { setCurrentWorkspace } = useWorkspaceActions();

  const {
    tasks: realTasks,
    handleToggleCompletion,
    handleUpdateTask,
    handleDeleteTask: originalHandleDeleteTask,
  } = useTaskManager(activeWorkspace);

  // Demo mode logic
  const [demoTasks, setDemoTasks] = useState<any[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const showLoginPrompt = useCallback(() => setLoginPromptOpen(true), []);
  const closeLoginPrompt = useCallback(() => setLoginPromptOpen(false), []);

  // Use tasks demo si isDemo
  const tasks = isDemo
    ? demoTasks.filter(task => task.workspace_id === activeWorkspace?.id)
    : realTasks;

  const filteredTasks = tasks;

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
    workspaces,
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
    setDemoTasks,
    setIsDemo,
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