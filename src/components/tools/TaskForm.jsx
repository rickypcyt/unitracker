import React, { useState, useEffect } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useDispatch } from 'react-redux';
import { updateTaskSuccess, addTaskSuccess } from '../../store/slices/TaskSlice';

const TaskForm = ({ initialAssignment = null, initialTask = null, onClose }) => {
  const { user } = useTaskManager();
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
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
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setDeadline(initialTask.deadline || new Date().toISOString().split('T')[0]);
      setDifficulty(initialTask.difficulty || 'medium');
      setAssignment(initialTask.assignment || '');
    }
  }, [initialAssignment, initialTask]);

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

    if (initialTask) {
      // Update existing task
      try {
        const updatedTask = {
          ...initialTask,
          title,
          description,
          deadline: deadline || null,
          difficulty,
          assignment: assignment.trim(),
        };

        // Actualizar el estado local inmediatamente
        dispatch(updateTaskSuccess(updatedTask));

        const { error } = await supabase
          .from('tasks')
          .update({
            title,
            description,
            deadline: deadline || null,
            difficulty,
            assignment: assignment.trim(),
          })
          .eq('id', initialTask.id);

        if (error) throw error;
        onClose();
      } catch (error) {
        console.error('Error updating task:', error);
      }
    } else {
      // Create new task
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
          // Actualizar el estado local inmediatamente
          dispatch(addTaskSuccess(data));
          onClose(data.id);
        }
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          {initialTask ? 'Edit Task' : 'Add New Task'}
        </h2>
        <button
          type="button"
          onClick={() => onClose()}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
            rows="3"
          />
        </div>

        {/* Assignment */}
        <div>
          <label htmlFor="assignment" className="block text-sm font-medium text-neutral-300 mb-1">
            Assignment
          </label>
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                id="assignment"
                value={assignment}
                onChange={(e) => {
                  setAssignment(e.target.value);
                  setAssignmentError(false);
                }}
                className={`flex-1 px-3 py-2 bg-neutral-800 border ${
                  assignmentError ? 'border-red-500' : 'border-neutral-700'
                } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary`}
                placeholder="Enter assignment name"
                required
              />
              <button
                type="button"
                onClick={() => setShowAssignmentInput(!showAssignmentInput)}
                className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-white transition-colors"
              >
                {showAssignmentInput ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

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

        {/* Deadline */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-neutral-300 mb-1">
            Deadline
          </label>
          <input
            type="date"
            id="deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-neutral-300 mb-1">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => onClose()}
          className="px-4 py-2 text-neutral-300 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
        >
          {initialTask ? 'Save Changes' : 'Add Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;