import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTask } from './TaskActions';

export const useTaskForm = (initialDeadline = '') => {
  const dispatch = useDispatch();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: initialDeadline,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(addTask(newTask)); // Llamada a la acción para agregar la tarea
      setNewTask({ title: '', description: '', deadline: '' }); // Limpiar el formulario
    } catch (error) {
      setError("Error adding task");
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