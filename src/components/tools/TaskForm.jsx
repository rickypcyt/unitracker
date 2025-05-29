import React, { useState, useEffect } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

const TaskForm = ({ initialAssignment = null, initialDeadline = null, onClose, onTaskCreated }) => {
  const { user } = useTaskManager();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(initialDeadline || new Date().toISOString().split('T')[0]);
  const [difficulty, setDifficulty] = useState('medium');
  const [assignment, setAssignment] = useState(initialAssignment || '');
  const [showAssignmentInput, setShowAssignmentInput] = useState(false);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [assignmentError, setAssignmentError] = useState(false);

  useEffect(() => {
    fetchAssignments();
    if (initialAssignment) {
      setAssignment(initialAssignment);
      setShowAssignmentInput(false);
    }
    if (initialDeadline) {
      setDeadline(initialDeadline);
    }
  }, [initialAssignment, initialDeadline]);

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('tasks')
        .select('assignment')
        .not('assignment', 'is', null)
        .not('assignment', 'eq', '')
        .order('assignment');
      if (error) throw error;
      setExistingAssignments([...new Set(data.map(task => task.assignment))]);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!assignment.trim()) {
      setAssignmentError(true);
      return;
    }

    setAssignmentError(false);

    const newTask = {
      title,
      description,
      deadline: deadline || null,
      difficulty,
      assignment: assignment.trim(),
      user_id: user.id,
      completed: false,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        onTaskCreated?.(data.id);
        onClose(data.id);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Add New Task</h2>
        <button onClick={() => onClose()} className="text-neutral-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Assignment Section */}
        <div className="space-y-2">
          <label className="block text-base font-medium text-neutral-400">
            Assignment
          </label>
          {assignmentError && (
            <p className="text-red-500 text-sm mb-1">Please select an assignment
            </p>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAssignmentInput(!showAssignmentInput)}
              className={`w-full px-3 py-2 bg-neutral-800/50 border rounded-lg text-neutral-100 flex justify-between items-center ${assignmentError ? 'border-red-500' : 'border-neutral-700/50 hover:border-neutral-700/50'
                }`}
            >
              <span>{assignment || 'Select or create assignment'}</span>
              {showAssignmentInput ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showAssignmentInput && (
              <div className="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg">
                <div className="p-2">
                  <input
                    type="text"
                    value={assignment}
                    onChange={(e) => {
                      setAssignment(e.target.value);
                      setAssignmentError(false);
                    }}
                    className={`w-full px-3 py-2 bg-neutral-700 rounded-lg text-white mb-2 focus:outline-none focus:ring-2 focus:ring-accent-primary ${assignmentError ? 'border border-red-500' : 'focus:ring-accent-primary'}`}
                    placeholder="Type to create new assignment"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {existingAssignments.map((existingAssignment) => (
                    <button
                      key={existingAssignment}
                      type="button"
                      onClick={() => {
                        setAssignment(existingAssignment);
                        setShowAssignmentInput(false);
                        setAssignmentError(false);
                      }}
                      className="w-full px-4 py-2 text-left text-neutral-200 hover:bg-neutral-700"
                    >
                      {existingAssignment}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title Section */}
        <div className="space-y-2">
          <label className="block text-base font-medium text-neutral-400">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            placeholder="Enter task title"
            required
          />
        </div>

        {/* Description Section */}
        <div className="space-y-2">
          <label className="block text-base font-medium text-neutral-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
            placeholder="Enter task description"
            rows={3}
          />
        </div>

        {/* Deadline and Difficulty Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-base font-medium text-neutral-400">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-neutral-400">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => onClose()}
            className="px-4 py-2 text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;