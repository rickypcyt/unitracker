import React, { useState, useEffect, useRef } from 'react';
import { useTaskForm } from '../redux/useTaskForm';
import { Rows4, Circle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

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
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [localAssignments, setLocalAssignments] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef(null);

  // Cargar assignments del localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('localTasks');
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);
      const uniqueAssignments = [...new Set(tasks.map(task => task.assignment).filter(Boolean))];
      setLocalAssignments(uniqueAssignments);
    }
  }, []);

  const handleAssignmentChange = (e) => {
    const value = e.target.value;
    updateField("assignment", value);
    
    // Filtrar sugerencias de ambas fuentes (DB y localStorage)
    const allAssignments = [...new Set([...assignments, ...localAssignments])];
    const filtered = allAssignments.filter(assignment => 
      assignment.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredAssignments(filtered);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    updateField("assignment", suggestion);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredAssignments.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredAssignments.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredAssignments.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (selectedIndex >= 0 && selectedIndex < filteredAssignments.length) {
          handleSuggestionClick(filteredAssignments[selectedIndex]);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (e.shiftKey) {
          setShowSuggestions(false);
        }
        break;
    }
  };

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
    <div className="maincard relative">
      <div className="">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
          <Rows4 size={24} className="mr-2" />
          Add New Task
        </h2>
      </div>

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
                ? ""
                : ""
            }`}
            value={newTask.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Enter task title"
          />
          {submitted && !newTask.title && (
            <span className="card-text-sm text-red-600">
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
          <div className="flex gap-2">
            <button
              onClick={handleSetToday}
              className="px-4 py-2 bg-neutral-800 text-text-primary rounded-lg hover:bg-neutral-700 transition-colors duration-200"
              type="button"
            >
              Today
            </button>
            <button
              onClick={handleSetTomorrow}
              className="px-4 py-2 bg-neutral-800 text-text-primary rounded-lg hover:bg-neutral-700 transition-colors duration-200"
              type="button"
            >
              Tomorrow
            </button>
            <input
              id="date"
              className={`textinput text-center flex-1 cursor-pointer${
                submitted && !newTask.deadline
                  ? "border-accent-secondary focus:ring-accent-secondary"
                  : ""
              }`}
              type="date"
              value={newTask.deadline}
              onChange={(e) => updateField("deadline", e.target.value)}
              tabIndex={newTask.deadline ? 0 : 1}
              onClick={(e) => e.target.showPicker()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.target.showPicker();
                }
              }}
            />
          </div>
          {submitted && !newTask.deadline && (
            <span className="card-text-sm text-red-600 place-self-center">
              Fill the date time.
            </span>
          )}
        </div>

        {/* Campos Difficulty y Assignment en la misma fila */}
        <div className="flex gap-4">
          {/* Campo Dificultad */}
          <div className="flex flex-col gap-2 flex-1">
            <label htmlFor="difficulty" className="card-text-lg">
              Difficulty
            </label>
            <div className="flex justify-start gap-8 items-center">
              <button
                type="button"
                onClick={() => updateField("difficulty", "easy")}
                className="flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group"
                aria-label="Set Easy Difficulty"
              >
                {newTask.difficulty === "easy" ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <Circle className="text-green-500" size={24} />
                )}
                <span className="text-green-500 text-md">Easy</span>
              </button>
              <button
                type="button"
                onClick={() => updateField("difficulty", "medium")}
                className="flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group"
                aria-label="Set Medium Difficulty"
              >
                {newTask.difficulty === "medium" ? (
                  <CheckCircle2 className="text-blue-500" size={24} />
                ) : (
                  <Circle className="text-blue-500" size={24} />
                )}
                <span className="text-blue-500 text-md">Medium</span>
              </button>
              <button
                type="button"
                onClick={() => updateField("difficulty", "hard")}
                className="flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group"
                aria-label="Set Hard Difficulty"
              >
                {newTask.difficulty === "hard" ? (
                  <CheckCircle2 className="text-red-500" size={24} />
                ) : (
                  <Circle className="text-red-500" size={24} />
                )}
                <span className="text-red-500 text-md">Hard</span>
              </button>
            </div>
          </div>

          {/* Campo Assignment con Autocompletado */}
          <div className="flex flex-col gap-2 flex-1">
            <label htmlFor="assignment" className="card-text-lg">
              Assignment
            </label>
            <div className="relative">
              <input
                type="text"
                id="assignment"
                className="textinput hover:bg-neutral-800 transition-colors duration-1000"
                value={newTask.assignment}
                onChange={handleAssignmentChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 500);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Choose an assignment"
              />
              {showSuggestions && filteredAssignments.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute w-full mt-1 bg-neutral-900 rounded-lg shadow-lg z-10 border border-neutral-800"
                >
                  {filteredAssignments.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`w-full px-4 py-2 text-left hover:bg-neutral-800 transition-colors duration-200 ${
                        index === selectedIndex ? 'bg-neutral-800' : ''
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
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