import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useSelector } from "react-redux";
import { useTaskForm } from "../redux/useTaskForm";
import "./Calendar.css";

const Calendar = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Usamos el custom hook con manejo de fecha inicial
  const {
    newTask,
    error,
    handleSubmit,
    updateField,
    setNewTask
  } = useTaskForm("");

  // Eventos para el calendario
  const events = tasks
    .filter((task) => task.deadline)
    .map((task) => ({
      title: task.title,
      date: task.deadline,
      backgroundColor: task.completed ? "#4CAF50" : "#4A6FFF"
    }));

  // Manejar doble click en día
  const handleDayDoubleClick = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    setSelectedDate(date);
    updateField('deadline', dateString);
    setShowModal(true);
  };

  // Submit modificado para cerrar modal
  const handleCalendarSubmit = async (e) => {
    const success = await handleSubmit(e);
    if (success) {
      setShowModal(false);
      setNewTask({ title: "", description: "", deadline: "" });
    }
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        contentHeight={500}
        headerToolbar={{
          left: "title",
          center: "",
          right: "prev,next"
        }}
        dayCellDidMount={(arg) => {
          arg.el.addEventListener("dblclick", () => {
            handleDayDoubleClick(arg.date);
          });
        }}
        eventDidMount={(info) => {
          info.el.style.cursor = "pointer";
          info.el.title = info.event.title;
        }}
      />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Crear tarea para {selectedDate?.toLocaleDateString()}</h3>
            
            {error && <div className="task-form-error-message">{error}</div>}

            <form onSubmit={handleCalendarSubmit}>
              <input
                type="text"
                placeholder="Título de la tarea"
                value={newTask.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
                className="task-input"
              />
              
              <textarea
                placeholder="Descripción (opcional)"
                value={newTask.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="task-input"
                rows="3"
              />
              
              <div className="task-date-group">
                <input
                  type="date"
                  value={newTask.deadline}
                  className="task-input"
                  disabled
                />
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-confirm"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;