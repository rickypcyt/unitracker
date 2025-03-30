import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Filter, Plus } from 'lucide-react';

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTaskData, setEditingTaskData] = useState<Task | null>(null);
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false);
  const [assignments, setAssignments] = useState<string[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const { user } = useAuth();
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // ... existing code ...

  return (
    <div className="bg-card-bg p-4 rounded-lg shadow-lg">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-text-primary">Task List</h2>
            {selectedAssignment && (
              <span className="text-base text-gray-400">{selectedAssignment}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssignmentDropdown(!showAssignmentDropdown)}
              className="p-2 text-text-primary hover:text-accent-primary"
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => setShowAddTask(true)}
              className="p-2 text-text-primary hover:text-accent-primary"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ... rest of the existing code ... */}

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              task.id === activeTaskId
                ? `bg-accent-primary/10 border-2 ${
                    task.difficulty === 'easy' ? 'border-green-500' :
                    task.difficulty === 'medium' ? 'border-blue-500' :
                    'border-red-500'
                  }`
                : 'bg-card-bg hover:bg-accent-primary/5 border border-gray-700'
            }`}
            onClick={() => handleTaskClick(task)}
          >
            {/* ... rest of the task item code ... */}
          </div>
        ))}
      </div>

      {/* ... rest of the existing code ... */}
    </div>
  );
};

export default TaskList; 