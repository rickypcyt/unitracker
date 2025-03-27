import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTask } from './TaskActions';
import { supabase } from '../utils/supabaseClient'; // Importa el cliente de Supabase

export const useTaskForm = (initialdate = '') => {
  const dispatch = useDispatch();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: initialdate,
  });
  const [error, setError] = useState('');

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
      setNewTask({ title: '', description: '', date: '' });
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
    handleSubmit,
    updateField,
    setNewTask,
    handleSetToday: () => {
      const today = new Date();
      const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      updateField('date', isoDate);
    },
    handleSetTomorrow: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      updateField('date', isoDate);
    }
  };
};