import React, { useState } from 'react';
import { useTaskForm } from '../redux/useTaskForm';
import { Rows4 } from 'lucide-react';
const TaskForm = () => {
  const {
    newTask,
    error,
    assignments,
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
    if (!newTask.title || !newTask.deadline) {
      return;
    }
    handleSubmit(e);
    setSubmitted(false);
  };

  return (
    <div className="maincard">
    <h2 className="card-title"><Rows4 size={24} />Add New Task</h2>
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {error && (
        <div className="text-accent-secondary card-text-lg mb-3 text-left bg-bg-surface p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Campo Título */}
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="card-text-lg">
          Task Title
        </label>
        <input
          id="title"
          className={`textinput${
            submitted && !newTask.title
              ? "border-accent-secondary focus:ring-accent-secondary"
              : ""
          }`}
          value={newTask.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Enter task title"
        />
        {submitted && !newTask.title && (
          <span className="card-text-lg text-red-600">
            Fill the title.
          </span>
        )}
      </div>

      {/* Campo Descripción (opcional) */}
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="card-text-lg">
          Description (optional)
        </label>
        <textarea
          id="description"
          className="textinput"
          value={newTask.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Enter task description"
        />
      </div>

      {/* Campo Fecha límite */}
      <div className="flex flex-col gap-2">
        <label htmlFor="date" className="card-text-lg">
          Deadline
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="textbutton"
              onClick={handleSetToday}
            >
              Today
            </button>
            <input
              id="date"
              className={`textinput text-center${
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
              className="textbutton"
              onClick={handleSetTomorrow}
            >
              Tomorrow
            </button>
          </div>
          {submitted && !newTask.deadline && (
            <span className="card-text-lg text-red-600 place-self-center">
              Fill the date time.
            </span>
          )}
        </div>
      </div>

      {/* Campos Difficulty y Assignment en la misma fila */}
      <div className="flex gap-4">
        {/* Campo Dificultad */}
        <div className="flex flex-col gap-2 flex-1">
          <label htmlFor="difficulty" className="card-text-lg">
            Difficulty
          </label>
          <select
            id="difficulty"
            className="textinput"
            value={newTask.difficulty}
            onChange={(e) => updateField("difficulty", e.target.value)}
          >
            <option value="easy" className="text-green-500">Easy</option>
            <option value="medium" className="text-blue-500">Medium</option>
            <option value="hard" className="text-red-500">Hard</option>
          </select>
        </div>

        {/* Campo Assignment */}
        <div className="flex flex-col gap-2 flex-1">
          <label htmlFor="assignment" className="card-text-lg">
            Assignment
          </label>
          <select
            id="assignment"
            className="textinput"
            value={newTask.assignment || ''}
            onChange={(e) => updateField("assignment", e.target.value)}
          >
            <option value="">Select an assignment</option>
            {assignments.map((assignment) => (
              <option key={assignment} value={assignment}>
                {assignment}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full mt-2 p-3 bg-blue-700 text-text-primary rounded-lg card-text font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-deep hover:shadow-lg active:translate-y-0.5"
      >
        Add Task
      </button>
    </form>
    </div>
  );
};

export default TaskForm;