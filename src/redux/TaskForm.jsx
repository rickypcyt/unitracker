import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "./TaskActions"; // Asegúrate de tener addTask en tu archivo de acciones
import "./TaskForm.css";

const TaskForm = () => {
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    tags: "", // Solo un tag como texto
  });
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState(""); // Para manejar el input de tags
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validar inputs
    if (!newTask.title) {
      setError("Task title is required");
      return;
    }
  
    if (!newTask.deadline) {
      setError("Deadline is required");
      return;
    }
  
    // Limpiar errores previos
    setError("");
  
    const taskToAdd = {
      title: newTask.title,
      description: newTask.description,
      deadline: newTask.deadline,
      completed: false,
      tags: newTask.tags, // Ahora un solo tag como texto
    };
  
    // Enviar la solicitud POST al servidor (puerto 5000)
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskToAdd),
      });
  
      const data = await response.json(); // Procesamos la respuesta como JSON
  
      if (response.ok) {
        console.log('Tarea agregada:', data);
        // Aquí puedes agregar el código para actualizar el estado o mostrar la nueva tarea
      } else {
        console.error('Error al agregar tarea:', data.message);
        setError(data.message); // Mostrar el error si lo hay
      }
    } catch (error) {
      console.error('Error al hacer la solicitud:', error);
      setError('Hubo un error al agregar la tarea');
    }
  
    setNewTask({ title: "", description: "", deadline: "", tags: "" }); // Limpiar el tag también
    setTagInput(""); // Limpiar input de tag
  };

  const handleTagChange = (e) => {
    setTagInput(e.target.value); // Actualizar input de tag
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      // Solo un tag, así que asignamos directamente
      setNewTask({
        ...newTask,
        tags: tagInput.trim(), // Asignamos el tag directamente
      });
      setTagInput(""); // Limpiar input de tag
    }
  };

  const handleTagRemove = () => {
    setNewTask({
      ...newTask,
      tags: "", // Limpiar el tag
    });
  };

  return (
    <div className="task-form-container">
      <form className="task-form" onSubmit={handleSubmit}>
        {error && <div className="task-form-error-message">{error}</div>}

        <div className="task-input-group">
          <input
            className={`task-input ${
              error && !newTask.title ? "task-input-error" : ""
            }`}
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Enter task title"
            required
          />
        </div>

        <input
          className="task-input"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          placeholder="Enter task description (optional)"
        />

        {/* Campo de texto para ingresar tags */}
        <div className="task-tag-input-group">
          <input
            className="task-tag-input"
            type="text"
            value={tagInput}
            onChange={handleTagChange}
            onKeyDown={handleAddTag}
            placeholder="Add a tag (press Enter)"
          />
        </div>
        
        <input
          className={`task-input ${
            error && !newTask.deadline ? "task-input-error" : ""
          }`}
          type="date"
          value={newTask.deadline}
          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
          required
        />

        {/* Mostrar el tag agregado */}
        {newTask.tags && (
          <div className="task-tags">
            <span className="task-tag">
              {newTask.tags}
              <button type="button" onClick={handleTagRemove}>
                &times;
              </button>
            </span>
          </div>
        )}

        <button type="submit" className="task-submit-button">
          Add Task
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
