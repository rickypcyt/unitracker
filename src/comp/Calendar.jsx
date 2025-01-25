import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useSelector, useDispatch } from "react-redux";
import "./Calendar.css";

const Calendar = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  // Eventos del calendario
  const events = tasks
    .filter((task) => task.deadline)
    .map((task) => ({
      title: task.title,
      date: task.deadline,
    }));

  // Manejar doble click en un día

  const handleDayDoubleClick = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    setSelectedDate(date);
    setNewTask({
      ...newTask,
      deadline: `${year}-${month}-${day}`
    });
    setShowModal(true);
  };
  
  // Enviar nuevo task
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTask.title.trim()) {
      dispatch({
        type: "ADD_TASK",
        payload: { ...newTask, id: Date.now(), completed: false },
      });
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
          right: "prev,next",
        }}
        dayCellDidMount={(arg) => {
          arg.el.addEventListener("dblclick", () => {
            handleDayDoubleClick(arg.date);
          });
        }}
      />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Crear tarea para {selectedDate.toDateString()}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Título"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                required
              />
              <textarea
                placeholder="Descripción"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
              <input
                type="date"
                value={newTask.deadline}
                disabled
              />
              <div className="modal-buttons">
                <button type="submit">Guardar</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
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