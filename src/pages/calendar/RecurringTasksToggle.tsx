import { Check } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useRecurringTasks } from './RecurringTasksContext';
import { useState } from 'react';

interface RecurringTasksToggleProps {
  className?: string;
}

const RecurringTasksToggle: React.FC<RecurringTasksToggleProps> = ({ className = '' }) => {
  const { tasks } = useAppStore((state) => state.tasks);
  const { showRecurring, setShowRecurring } = useRecurringTasks();
  
  // Count recurring tasks
  const recurringCount = tasks.filter((task: any) => {
    return task.recurrence_type && task.recurrence_type !== 'none';
  }).length;

  const handleToggle = () => {
    setShowRecurring(!showRecurring);
  };

  return (
    <div className={`relative ${className}`}>
      <label 
        className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
        onClick={handleToggle}
      >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
          showRecurring 
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' 
            : 'border-[var(--border-primary)] text-[var(--text-secondary)]'
        }`}>
          {showRecurring && <Check className="w-2.5 h-2.5" />}
        </div>
        <span className={`text-sm font-medium transition-colors ${
          showRecurring ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
        }`}>
          Show Recurring Tasks
          {recurringCount > 0 && (
            <span className="text-xs text-[var(--text-secondary)] ml-2">
              ({recurringCount})
            </span>
          )}
        </span>
      </label>
    </div>
  );
};

export default RecurringTasksToggle;
