import { useEffect, useState } from "react";

import { useUiActions } from '@/store/appStore';

interface Task {
  id: string;
  [key: string]: any;
}

export const useTaskDetails = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [taskDetailsEdit, setTaskEditing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { setCalendarVisible } = useUiActions();

  // Abre el modal de detalles y edita la tarea seleccionada
  const handleOpenTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setEditedTask(task);
    setTaskEditing(true);
    setSelectedTaskId(task.id);
    setCalendarVisible(false); // Oculta el calendario si está abierto
  };

  // Cierra el modal de detalles
  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    setEditedTask(null);
    setTaskEditing(false);
    setSelectedTaskId(null);
    setCalendarVisible(true); // Muestra el calendario si estaba oculto
  };

  // Actualiza los campos de la tarea editada
  const handleEditTaskField = (field: string, value: any) => {
    setEditedTask((prev) =>
      prev ? {
        ...prev,
        [field]: value,
      } : null
    );
  };

  // Sincroniza el editedTask si cambia la tarea seleccionada
  useEffect(() => {
    setEditedTask(selectedTask);
  }, [selectedTask]);

  return {
    selectedTask,
    editedTask,
    taskDetailsEdit,
    setTaskEditing,
    handleOpenTaskDetails,
    handleCloseTaskDetails,
    handleEditTaskField,
    setEditedTask,
    selectedTaskId,
  };
};
