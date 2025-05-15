import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCalendarVisibility } from "../redux/uiSlice";

export const useTaskDetails = () => {
  const dispatch = useDispatch();
  const [selectedTask, setSelectedTask] = useState(null);
  const [editedTask, setEditedTask] = useState(null);
  const [taskDetailsEdit, setTaskEditing] = useState(false);

  // Abre el modal de detalles y edita la tarea seleccionada
  const handleOpenTaskDetails = (task) => {
    setSelectedTask(task);
    setEditedTask(task);
    setTaskEditing(true);
    dispatch(setCalendarVisibility(false)); // Oculta el calendario si está abierto
  };

  // Cierra el modal de detalles
  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    setEditedTask(null);
    setTaskEditing(false);
    dispatch(setCalendarVisibility(true)); // Muestra el calendario si estaba oculto
  };

  // Actualiza los campos de la tarea editada
  const handleEditTaskField = (field, value) => {
    setEditedTask((prev) => ({
      ...prev,
      [field]: value,
    }));
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
  };
};
