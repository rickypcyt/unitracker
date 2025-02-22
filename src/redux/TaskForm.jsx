import React, { useState } from 'react';
import { useTaskForm } from './useTaskForm';

const TaskForm = () => {
  const {
    newTask,
    error,
    handleSubmit,
    updateField,
    handleSetToday,
    handleSetTomorrow
  } = useTaskForm();

  // Estado para determinar si se intentó enviar el formulario
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Validamos que los campos obligatorios tengan valor
    if (!newTask.title || !newTask.deadline) {
      return; // Si falta algún campo, no se llama a handleSubmit
    }
    handleSubmit(e);
    setSubmitted(false);
  };

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg mr-2 ml-2">
      <h2 className="text-2xl font-bold mb-6 text-text-primary">Add New Task</h2>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {error && (
          <div className="text-accent-secondary text-sm mb-3 text-left bg-bg-surface p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Campo Título */}
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-text-secondary text-sm">
            Task Title
          </label>
          <input
            id="title"
            className={`w-full p-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 ${
              submitted && !newTask.title
                ? "border-accent-secondary focus:ring-accent-secondary"
                : ""
            }`}
            value={newTask.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Enter task title"
          />
          {submitted && !newTask.title && (
            <span className="text-s text-red-600">
              Falta rellenar el título.
            </span>
          )}
        </div>

        {/* Campo Descripción (opcional) */}
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-text-secondary text-sm">
            Description (optional)
          </label>
          <textarea
            id="description"
            className="w-full p-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 min-h-[50px]"
            value={newTask.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Enter task description"
          />
        </div>

        {/* Campo Fecha límite */}
        <div className="flex flex-col gap-2">
          <label htmlFor="deadline" className="text-text-secondary text-sm">
            Deadline
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <button
                type="button"
                className="px-4 py-2 bg-accent-tertiary text-text-primary rounded-lg hover:bg-accent-deep transition-colors duration-200 flex-grow"
                onClick={handleSetToday}
              >
                Today
              </button>
              <input
                id="deadline"
                className={`flex-grow p-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 ${
                  submitted && !newTask.deadline
                    ? "border-accent-secondary focus:ring-accent-secondary"
                    : ""
                }`}
                type="date"
                value={newTask.deadline}
                onChange={(e) => updateField("deadline", e.target.value)}
              />
              <button
                type="button"
                className="px-4 py-2 bg-accent-tertiary text-text-primary rounded-lg hover:bg-accent-deep transition-colors duration-200 flex-grow"
                onClick={handleSetTomorrow}
              >
                Tomorrow
              </button>
            </div>
            {submitted && !newTask.deadline && (
              <span className="text-s text-red-600 place-self-center">
                Falta rellenar la fecha límite.
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-6 p-4 bg-accent-primary text-text-primary rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-deep hover:shadow-lg active:translate-y-0.5"
        >
          Add Task
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
2