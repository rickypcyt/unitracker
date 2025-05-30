import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, ArrowLeft, Check, ChevronDown, ChevronRight } from 'lucide-react';

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
  availableTitle = 'Available Tasks'
}) => {
  const [expandedGroups, setExpandedGroups] = useState({});

  // Initialize expanded state for new groups
  useEffect(() => {
    // Siempre agrupar por assignment
    const newExpandedState = { ...expandedGroups };
    const assignments = [...new Set(availableTasks.map(task => task.assignment || 'No Assignment'))];
    assignments.forEach(assignment => {
      if (newExpandedState[assignment] === undefined) {
        newExpandedState[assignment] = false; // Start collapsed
      }
    });
    setExpandedGroups(newExpandedState);
  }, [availableTasks]);

  const toggleGroup = (assignment) => {
    setExpandedGroups(prev => ({
      ...prev,
      [assignment]: !prev[assignment]
    }));
  };

  const renderTaskCard = (task, isActive) => {
    const commonClasses = "p-3 rounded-lg cursor-pointer transition-colors";
    const activeClasses = "bg-accent-primary/20 border border-accent-primary";
    const availableClasses = "bg-neutral-800 hover:bg-neutral-700";

    if (mode === 'select') {
      return (
        <div
          key={task.id}
          className={`${commonClasses} ${
            selectedTasks.includes(task.id) ? activeClasses : availableClasses
          }`}
          onClick={() => onTaskSelect(task.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{task.title}</div>
              {task.description && (
                <div className="text-sm text-neutral-400 mt-1">
                  {task.description}
                </div>
              )}
              {task.assignment && (
                <div className="text-xs text-neutral-500 mt-1">
                  Assignment: {task.assignment}
                </div>
              )}
            </div>
            {selectedTasks.includes(task.id) && (
              <Check size={20} className="text-accent-primary" />
            )}
          </div>
        </div>
      );
    }

    // For 'move' and 'edit' modes
    return (
      <div
        key={task.id}
        className={`${commonClasses} ${isActive ? activeClasses : availableClasses}`}
        onClick={() => !isActive && onMoveTask(task, true)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{task.title}</div>
            {task.description && (
              <div className="text-md text-neutral-400 mt-1">
                {task.description}
              </div>
            )}
            {task.assignment && (
              <div className="text-xs text-neutral-500 mt-1">
                Assignment: {task.assignment}
              </div>
            )}
          </div>
          {isActive ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveTask(task, false);
              }}
              className="p-1 hover:bg-neutral-700 rounded-full transition-colors"
              title="Move to Available Tasks"
            >
              <ArrowLeft size={20} className="text-neutral-400" />
            </button>
          ) : (
            <ArrowRight size={20} className="text-neutral-400" />
          )}
        </div>
      </div>
    );
  };

  const renderActiveTasks = () => (
    <div className={`space-y-2 max-h-[${maxHeight}] overflow-y-auto`}>
      {activeTasks.map(task => renderTaskCard(task, true))}
      {activeTasks.length === 0 && (
        <div className="text-center text-neutral-500 py-4">
          {mode === 'select' ? 'No tasks selected' : 'No active tasks'}
        </div>
      )}
    </div>
  );

  const renderAvailableTasks = () => {
    // Siempre agrupar por assignment
    // Group tasks by assignment
    const tasksByAssignment = availableTasks.reduce((acc, task) => {
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
      <div className={`max-h-[${maxHeight}] overflow-y-auto`}>
        <div className="space-y-2">
          {sortedAssignments.map(assignment => (
            <div key={assignment} className="border border-neutral-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleGroup(assignment)}
                className="w-full px-4 py-2 flex items-center justify-between bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                <span className="font-medium text-neutral-300">{assignment}</span>
                {expandedGroups[assignment] ? (
                  <ChevronDown size={20} className="text-neutral-400" />
                ) : (
                  <ChevronRight size={20} className="text-neutral-400" />
                )}
              </button>
              {expandedGroups[assignment] && (
                <div className="p-2 space-y-2 bg-neutral-900">
                  {tasksByAssignment[assignment].map(task => renderTaskCard(task, false))}
                </div>
              )}
            </div>
          ))}
          {availableTasks.length === 0 && (
            <div className="text-center text-neutral-500 py-4">
              No available tasks
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left Column - Active Tasks */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{activeTitle}</h3>
          <span className="text-md text-neutral-400">
            {activeTasks.length} tasks
          </span>
        </div>
        {renderActiveTasks()}
      </div>

      {/* Right Column - Available Tasks */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{availableTitle}</h3>
          {showNewTaskButton && (
            <button
              onClick={onAddTask}
              className="flex items-center gap-1 text-accent-primary hover:text-accent-primary/80"
            >
              <Plus size={20} />
              New Task
            </button>
          )}
        </div>
        {renderAvailableTasks()}
      </div>
    </div>
  );
};

export default TaskSelectionPanel; 