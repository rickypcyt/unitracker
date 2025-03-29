import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addTask } from './TaskActions';
import { supabase } from '../utils/supabaseClient'; // Importa el cliente de Supabase

export const useTaskForm = (initialdate = '') => {
  const dispatch = useDispatch();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: initialdate,
    difficulty: 'medium', // Add default difficulty
    assignment: '', // Add assignment field
  });
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);

  // Fetch assignments when component mounts
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('tasks')
          .select('assignment')
          .eq('user_id', user.id)
          .not('assignment', 'is', null)
          .not('assignment', 'eq', '')
          .order('assignment');
        
        if (error) throw error;
        
        // Get unique assignments and remove duplicates
        const uniqueAssignments = [...new Set(data.map(task => task.assignment))];
        setAssignments(uniqueAssignments);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };

    fetchAssignments();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Obtener el usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Agregar el user_id al objeto newTask
      const taskWithUser = {
        ...newTask,
        user_id: user.id, // Asociar la tarea al usuario
      };

      // Llamada a la acción para agregar la tarea
      await dispatch(addTask(taskWithUser));

      // Limpiar el formulario
      setNewTask({ title: '', description: '', deadline: '', difficulty: 'medium', assignment: '' });
      setError(''); // Limpiar el error si la operación fue exitosa
    } catch (error) {
      setError("Error adding task: " + error.message);
    }
  };

  const updateField = (field, value) => {
    setNewTask(prev => ({ ...prev, [field]: value }));
  };

  return {
    newTask,
    error,
    assignments,
    handleSubmit,
    updateField,
    setNewTask,
    handleSetToday: () => {
      const today = new Date();
      const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      updateField('deadline', isoDate);
    },
    handleSetTomorrow: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      updateField('deadline', isoDate);
    }
  };
};