import { Check, Plus, X } from 'lucide-react';
import { FormActions, FormButton, FormInput, FormTextarea } from '../common/FormElements';
import React, { useEffect, useState } from 'react';

import BaseModal from '../common/BaseModal';
import TaskForm from '../tools/TaskForm';
import TaskSelectionPanel from '../tools/TaskSelectionPanel';
import { supabase } from '../../config/supabaseClient';

const StartSessionModal = ({ isOpen, onClose, onStart }) => {
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSessionTasks();
      setSessionTitle('');
      setSessionDescription('');
      setSelectedTasks([]);
      setTitleError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (lastAddedTaskId) {
      setSelectedTasks(prev => [...prev, lastAddedTaskId]);
      setLastAddedTaskId(null);
      fetchSessionTasks();
    }
  }, [lastAddedTaskId]);

  const fetchSessionTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch all tasks for the user
      const { data: userTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching user tasks:', tasksError);
        setTasks([]);
        setSelectedTasks([]);
        return;
      }

      setTasks(userTasks);
      // Initialize selectedTasks with tasks that are already active
      setSelectedTasks(userTasks.filter(task => task.activetask).map(task => task.id));
    } catch (error) {
      console.error('Error in fetchSessionTasks:', error);
      setTasks([]);
      setSelectedTasks([]);
    }
  };

  // Modified function to handle task movement between columns
  const handleMoveTask = (task, toActive) => {
    setSelectedTasks(prev => {
      if (toActive) {
        // Add task ID to selectedTasks if moving to active column
        if (!prev.includes(task.id)) {
          return [...prev, task.id];
        }
      } else {
        // Remove task ID from selectedTasks if moving to available column
        return prev.filter(id => id !== task.id);
      }
      return prev; // Return previous state if no change
    });
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleStart = async () => {
    if (!sessionTitle.trim()) {
      setTitleError(true);
      return;
    }

    setTitleError(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get today's date for session number calculation
      const today = new Date().toISOString().split("T")[0];
      console.log('Fetching latest session for date:', today);

      const { data: latestSession, error: latestSessionError } = await supabase
        .from('study_laps')
        .select('session_number')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('session_number', { ascending: false })
        .limit(1)
        .single();

      if (latestSessionError && latestSessionError.code !== 'PGRST116') throw latestSessionError;

      // Calculate next session number
      const nextSessionNumber = latestSession ? Number(latestSession.session_number) + 1 : 1;
      console.log('Creating new session with number:', nextSessionNumber);

      // Check if a session with this title already exists today
      const { data: existingSession, error: checkError } = await supabase
        .from('study_laps')
        .select('id')
        .eq('name', sessionTitle.trim())
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing session:', checkError);
      }

      if (existingSession) {
        console.warn('Session with this title already exists today:', existingSession);
        return;
      }

      // Create the new session
      const { data: session, error: sessionError } = await supabase
        .from('study_laps')
        .insert([{
          user_id: user.id,
          started_at: new Date().toISOString(),
          tasks_completed: 0, // Will be updated on finish
          name: sessionTitle.trim(),
          description: sessionDescription.trim(),
          session_number: nextSessionNumber,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;
      console.log('Successfully created new session:', session.id);

      // Link selected tasks to the new session and set activetask to true
      if (selectedTasks.length > 0) {
        // Insert links into session_tasks table
        const { error: sessionTasksError } = await supabase
          .from('session_tasks')
          .insert(
            selectedTasks.map(taskId => ({
              session_id: session.id,
              task_id: taskId,
              completed_at: null // Not completed when session starts
            }))
          );

        if (sessionTasksError) throw sessionTasksError;

        // Update activetask status for selected tasks
        const { error: updateTasksError } = await supabase
          .from('tasks')
          .update({ activetask: true })
          .in('id', selectedTasks);

        if (updateTasksError) {
          console.error('Error updating tasks activetask status:', updateTasksError);
        }
      }

      // Pass the created session details back to StudyTimer
      onStart({
        sessionId: session.id,
        tasks: selectedTasks,
        title: sessionTitle.trim()
      });

      // Close the modal after successful session start
      onClose();

    } catch (error) {
      console.error('Error starting session:', error);
      // Optionally show a toast or error message
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Session"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <FormInput
            id="sessionTitle"
            label="Session Title"
            value={sessionTitle}
            onChange={setSessionTitle}
            error={titleError ? "Please enter a session title" : null}
            required
            placeholder="Enter session title"
          />

          <FormTextarea
            id="sessionDescription"
            label="Description (Optional)"
            value={sessionDescription}
            onChange={setSessionDescription}
            placeholder="Enter session description"
          />
        </div>

        <TaskSelectionPanel
          activeTasks={tasks.filter(task => selectedTasks.includes(task.id))}
          availableTasks={tasks.filter(task => !selectedTasks.includes(task.id))}
          onMoveTask={handleMoveTask}
          onAddTask={() => setShowTaskForm(true)}
          mode="move"
          selectedTasks={selectedTasks}
          showNewTaskButton={true}
          activeTitle="Active Tasks"
          availableTitle="Available Tasks"
        />

        <FormActions>
          <FormButton
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </FormButton>
          <FormButton
            type="button"
            variant="primary"
            onClick={handleStart}
          >
            Start Session
          </FormButton>
        </FormActions>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleTaskFormClose}
          onTaskCreated={(newTaskId) => {
            fetchSessionTasks();
            setSelectedTasks(prev => [...prev, newTaskId]);
          }}
        />
      )}
    </BaseModal>
  );
};

export default StartSessionModal; 