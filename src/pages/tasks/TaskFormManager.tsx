import AITaskForm from './AITaskForm';
import TaskForm from './TaskForm';
import { useState } from 'react';

type TaskFormManagerProps = {
  initialAssignment?: string | null;
  initialTask?: any | null;
  initialDeadline?: string | Date | null;
  initialActiveTab?: 'ai' | 'manual';
  focusOnDate?: boolean;
  onClose: () => void;
  onTaskCreated?: (id: string) => void;
};

const TaskFormManager = ({
  initialAssignment = null,
  initialTask = null,
  initialDeadline = null,
  initialActiveTab = 'manual',
  focusOnDate = false,
  onClose,
  onTaskCreated
}: TaskFormManagerProps) => {
  const [activeMode, setActiveMode] = useState<'ai' | 'manual'>(
    initialTask ? 'manual' : initialActiveTab
  );

  if (activeMode === 'ai') {
    return (
      <AITaskForm
        onClose={onClose}
        onSwitchToManual={() => setActiveMode('manual')}
      />
    );
  }

  return (
    <TaskForm
      initialAssignment={initialAssignment}
      initialTask={initialTask}
      initialDeadline={initialDeadline}
      focusOnDate={focusOnDate}
      onClose={onClose}
      onTaskCreated={onTaskCreated || (() => {})}
      onSwitchToAI={() => {
        console.log('TaskFormManager: Switching to AI mode');
        setActiveMode('ai');
      }}
    />
  );
};

export default TaskFormManager;