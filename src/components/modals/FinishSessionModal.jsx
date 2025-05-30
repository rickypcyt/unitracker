import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { X } from 'lucide-react';
import TaskForm from '../tools/TaskForm';
import TaskSelectionPanel from '../tools/TaskSelectionPanel';

const FinishSessionModal = ({ isOpen, onClose, session, onFinish }) => {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [incompleteTasks, setIncompleteTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    if (isOpen && session?.id) {
      fetchSessionDetails();
      fetchSessionTasks();
      // Set session start time when modal opens
      setSessionStartTime(new Date());
    }
  }, [isOpen, session?.id]);

  const fetchSessionDetails = async () => {
    try {
      const { data: session, error } = await supabase
        .from('study_laps')
        .select('description')
        .eq('id', session.id)
        .single();

      if (error) {
        console.error('Error fetching session details:', error);
        return;
      }

      if (session) {
        setSessionNotes(session.description || 'Untitled Session');
      }
    } catch (error) {
      console.error('Error in fetchSessionDetails:', error);
    }
  };

  const fetchSessionTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch all tasks for the user
      const { data: userTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching user tasks:', tasksError);
        setTasks([]);
        setCompletedTasks([]);
        setIncompleteTasks([]);
        return;
      }

      // Separate tasks based on completed status
      const completed = userTasks.filter(task => task.completed);
      const incomplete = userTasks.filter(task => !task.completed);

      setTasks(userTasks);
      setCompletedTasks(completed.map(task => task.id));
      setIncompleteTasks(incomplete.map(task => task.id));

    } catch (error) {
      console.error('Error in fetchSessionTasks:', error);
      setTasks([]);
      setCompletedTasks([]);
      setIncompleteTasks([]);
    }
  };

  const handleTaskToggle = (taskId) => {
    setCompletedTasks(prev => {
      if (prev.includes(taskId)) {
        // Move to incomplete
        setIncompleteTasks(prevIncomplete => [...prevIncomplete, tasks.find(t => t.id === taskId).id]);
        return prev.filter(id => id !== taskId);
      } else {
        // Move to completed
        setIncompleteTasks(prevIncomplete => prevIncomplete.filter(t => t !== taskId));
        return [...prev, taskId];
      }
    });
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      fetchSessionTasks(); // Refresh the list after adding a new task
    }
  };

  const toggleTaskStatus = async (taskId, completed) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in toggleTaskStatus:', error);
      throw error;
    }
  };

  const handleFinish = async () => {
    try {
      // Calculate session duration in minutes
      const endTime = new Date();
      const startTime = sessionStartTime || new Date(session.started_at);
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

      // Update session with duration and notes
      const { error: updateError } = await supabase
        .from('study_laps')
        .update({ 
          duration: durationMinutes,
          description: sessionNotes.trim() || null
        })
        .eq('id', session.id);

      if (updateError) {
        console.error('Error updating session:', updateError);
        throw updateError;
      }

      // Update tasks as completed
      const taskIdsToComplete = completedTasks;
      const completionPromises = taskIdsToComplete.map(taskId =>
        toggleTaskStatus(taskId, true)
      );

      await Promise.all(completionPromises);
      console.log('Tasks marked as completed');
      onFinish(taskIdsToComplete);
      onClose();
    } catch (error) {
      console.error('Error finishing session:', error);
      // Don't close the modal on error
      // onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Finish Session</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="sessionNotes" className="block text-sm font-medium text-neutral-300 mb-1">
                Session Notes (Optional)
              </label>
              <textarea
                id="sessionNotes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                rows="3"
                placeholder="Add any notes about this session"
              />
            </div>
          </div>
        </div>

        <TaskSelectionPanel
          activeTasks={tasks.filter(task => completedTasks.includes(task.id))}
          availableTasks={tasks.filter(task => !completedTasks.includes(task.id))}
          onTaskSelect={handleTaskToggle}
          onAddTask={() => setShowTaskForm(true)}
          mode="select"
          selectedTasks={completedTasks}
          showNewTaskButton={false}
          activeTitle="Completed Tasks"
          availableTitle="Incomplete Tasks"
          groupByAssignment={true}
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleFinish}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            Finish Session
          </button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md">
            <TaskForm
              onClose={handleTaskFormClose}
              onTaskCreated={(newTaskId) => {
                fetchSessionTasks();
                setIncompleteTasks(prev => [...prev, newTaskId]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishSessionModal; 