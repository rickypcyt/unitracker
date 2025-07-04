import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import LoginPromptModal from '@/modals/LoginPromptModal';
import { useAuth } from '@/hooks/useAuth';

const TaskSelectionPanel = ({
  activeTasks = [],
  availableTasks = [],
  onMoveTask,
  onAddTask,
  mode = 'select', // 'select' | 'move' | 'edit'
  selectedTasks = [], // Only used in 'select' mode
  onTaskSelect, // Only used in 'select' mode
  showNewTaskButton = true,
  maxHeight = '400px',
  activeTitle = 'Active Tasks',
  availableTitle = 'Available Tasks',
  hideAssignmentAndDescriptionAvailable = false
}) => {
  const { isLoggedIn } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  // Filter out any invalid tasks
  const validActiveTasks = useMemo(() => 
    activeTasks.filter(task => task && typeof task === 'object' && task.id),
    [activeTasks]
  );
  
  const validAvailableTasks = useMemo(() => 
    availableTasks.filter(task => task && typeof task === 'object' && task.id),
    [availableTasks]
  );

  // Memoize the assignments to prevent unnecessary recalculations
  const assignments = useMemo(() => 
    [...new Set(validAvailableTasks.map(task => task.assignment || 'No Assignment'))],
    [validAvailableTasks]
  );

  // Initialize expanded state for new groups
  useEffect(() => {
    const newExpandedState = { ...expandedGroups };
    let hasChanges = false;

    assignments.forEach(assignment => {
      if (newExpandedState[assignment] === undefined) {
        newExpandedState[assignment] = false; // Start collapsed
        hasChanges = true;
      }
    });

    // Only update state if there are actual changes
    if (hasChanges) {
      setExpandedGroups(newExpandedState);
    }
  }, [assignments]); // Only depend on the memoized assignments array

  const toggleGroup = (assignment) => {
    setExpandedGroups(prev => ({
      ...prev,
      [assignment]: !prev[assignment]
    }));
  };

  const handleAddTask = () => {
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true);
      return;
    }
    onAddTask();
  };

  const renderTaskCard = (task, isActive, isAvailableCustom = false) => {
    if (!task || typeof task !== 'object' || !task.id) {
      return null;
    }

    // Use utility classes instead of inline classes
    const taskClasses = `task-item-base task-item-flex ${
      mode === 'select' && selectedTasks.includes(task.id) ? 'task-item-active' : 
      isActive ? 'task-item-active' : 
      'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] hover:border-[var(--border-primary)]/70'
    }`;

    // Compacto y con assignment en active tasks
    if (isActive && mode === 'move') {
      return (
        <div
          key={task.id}
          className={taskClasses + ' px-2 py-1 min-h-0 w-full overflow-x-auto border-2 rounded-[1rem]'}
        >
          <div className="flex items-center gap-2 w-full">
            {task.assignment && (
              <span className="text-[var(--accent-primary)] font-semibold text-sm whitespace-nowrap">[{task.assignment}]</span>
            )}
            <span className="font-medium text-[var(--text-primary)] truncate">{task.title}</span>
            <button
              onClick={() => onMoveTask(task, false)}
              className="flex-shrink-0 p-0.5 hover:bg-[var(--bg-hover)] rounded-full transition-colors ml-auto"
              title="Move to Available Tasks"
            >
              <ArrowRight size={18} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'select') {
      return (
        <div
          key={task.id}
          className={taskClasses}
          onClick={() => onTaskSelect(task.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[var(--text-primary)]">{task.title}</div>
              {task.description && (
                <div className="text-sm text-[var(--text-secondary)] mt-1">
                  {task.description}
                </div>
              )}
              {task.assignment && (
                <div className="text-sm text-[var(--text-secondary)] mt-1">
                  {task.assignment}
                </div>
              )}
            </div>
            {selectedTasks.includes(task.id) && (
              <Check size={20} className="text-[var(--accent-primary)]" />
            )}
          </div>
        </div>
      );
    }

    // For 'move' and 'edit' modes
    if (isAvailableCustom) {
      // Solo título y flecha a la izquierda, compacto
      return (
        <div
          key={task.id}
          className={taskClasses + ' px-2 py-1 min-h-0 w-full overflow-x-auto border-2 rounded-[1rem]'}
          onClick={() => !isActive && onMoveTask(task, true)}
        >
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveTask(task, true);
              }}
              className="flex-shrink-0 p-0.5 hover:bg-[var(--bg-hover)] rounded-full transition-colors"
              title="Move to Active Tasks"
            >
              <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
            </button>
            <div className="font-medium text-[var(--text-primary)] truncate">{task.title}</div>
          </div>
        </div>
      );
    }
    // Default render
    return (
      <div
        key={task.id}
        className={taskClasses}
        onClick={() => !isActive && onMoveTask(task, true)}
      >
        <div className="flex items-center justify-between w-full">
          {isActive ? (
            <>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text-primary)]">{task.title}</div>
                {task.assignment && (
                  <div className="text-sm text-[var(--text-secondary)] mt-1">
                    {task.assignment}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveTask(task, false);
                }}
                className="flex-shrink-0 p-1 hover:bg-[var(--bg-hover)] rounded-full transition-colors"
                title="Move to Available Tasks"
              >
                <ArrowRight size={20} className="text-[var(--text-secondary)]" />
              </button>
            </>
          ) : (
            <>
              <div className="flex-shrink-0 mr-2">
                <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text-primary)]">{task.title}</div>
                {task.description && (
                  <div className="text-md text-[var(--text-secondary)] mt-1">
                    {task.description}
                  </div>
                )}
                {task.assignment && (
                  <div className="text-sm text-[var(--text-secondary)] mt-1">
                    {task.assignment}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderActiveTasks = () => (
    <div className="space-y-2 h-auto overflow-y-auto custom-scrollbar">
      {validActiveTasks.map(task => renderTaskCard(task, true))}
      {validActiveTasks.length === 0 && (
        <div className="text-center text-[var(--text-secondary)] py-4">
          {mode === 'select' ? 'No tasks selected' : 'No active tasks'}
        </div>
      )}
    </div>
  );

  const renderAvailableTasks = () => {
    // Siempre agrupar por assignment
    // Group tasks by assignment
    const tasksByAssignment = validAvailableTasks.reduce((acc, task) => {
      if (!task || typeof task !== 'object' || !task.id) return acc;
      const assignment = task.assignment || 'No Assignment';
      if (!acc[assignment]) {
        acc[assignment] = [];
      }
      acc[assignment].push(task);
      return acc;
    }, {});

    // Sort assignments alphabetically
    const sortedAssignments = Object.keys(tasksByAssignment).sort();

    return (
      <div className="h-auto overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {sortedAssignments.map(assignment => (
            <div key={assignment} className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
              <button
                onClick={() => toggleGroup(assignment)}
                className="w-full px-4 py-2 flex items-center justify-between bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <span className="font-medium text-[var(--text-primary)]">{assignment}</span>
                {expandedGroups[assignment] ? (
                  <ChevronDown size={20} className="text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight size={20} className="text-[var(--text-secondary)]" />
                )}
              </button>
              {expandedGroups[assignment] && (
                <div className="p-2 space-y-2 bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
                  {tasksByAssignment[assignment].map(task => renderTaskCard(task, false, hideAssignmentAndDescriptionAvailable))}
                </div>
              )}
            </div>
          ))}
          {validAvailableTasks.length === 0 && (
            <div className="text-center text-[var(--text-secondary)] py-4">
              No available tasks
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-auto">
      {/* Left Column - Active Tasks */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">{activeTitle}</h3>
          <span className="text-md text-[var(--text-secondary)]">
            {validActiveTasks.length} tasks
          </span>
        </div>
        {renderActiveTasks()}
      </div>

      {/* Right Column - Available Tasks */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">{availableTitle}</h3>
          {showNewTaskButton && (
            <button
              onClick={handleAddTask}
              className="flex items-center gap-1 text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80"
            >
              <Plus size={20} />
              New Task
            </button>
          )}
        </div>
        {renderAvailableTasks()}
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
      />
    </div>
  );
};

export default TaskSelectionPanel; 