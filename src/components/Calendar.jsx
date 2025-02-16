import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useSelector } from "react-redux";
import { useTaskForm } from "../redux/useTaskForm";

const Calendar = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const {
    newTask,
    error,
    handleSubmit,
    updateField,
    setNewTask
  } = useTaskForm("");

  const events = tasks
    .filter((task) => task.deadline)
    .map((task) => ({
      title: task.title,
      date: task.deadline,
      backgroundColor: task.completed ? "#023E7D" : "#0466C8" // Actualizados a nuevos colores
    }));

  const handleDayDoubleClick = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    setSelectedDate(date);
    updateField('deadline', dateString);
    setShowModal(true);
  };

  const handleCalendarSubmit = async (e) => {
    const success = await handleSubmit(e);
    if (success) {
      setShowModal(false);
      setNewTask({ title: "", description: "", deadline: "" });
    }
  };

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg transition-all duration-300 ease-in-out hover:translate-y-[-0.2rem] hover:shadow-xl mr-1 ml-1">
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
          info.el.style.border = "none"; // Eliminar bordes por defecto
          info.el.style.borderRadius = "4px"; // Añadir esquinas redondeadas
        }}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-secondary p-6 rounded-2xl min-w-[320px] border border-border-primary shadow-2xl">
            <h3 className="text-xl font-semibold text-text-primary mb-6">
              Crear tarea para {selectedDate?.toLocaleDateString()}
            </h3>
            
            {error && <div className="text-accent-secondary mb-4">{error}</div>}

            <form onSubmit={handleCalendarSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Título de la tarea"
                value={newTask.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
                className="w-full p-3 bg-tertiary border border-border-primary rounded-lg text-text-primary text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              
              <textarea
                placeholder="Descripción (opcional)"
                value={newTask.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full p-3 bg-tertiary border border-border-primary rounded-lg text-text-primary text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary"
                rows="3"
              />
              
              <div>
                <input
                  type="date"
                  value={newTask.deadline}
                  className="w-full p-3 bg-tertiary border border-border-primary rounded-lg text-text-primary text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  disabled
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-5 py-2 bg-tertiary text-text-secondary border border-border-primary rounded-lg font-medium transition-all duration-200 hover:bg-accent-deep hover:text-text-primary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent-primary text-text-primary rounded-lg font-medium transition-all duration-200 hover:bg-accent-secondary"
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