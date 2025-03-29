import { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useTaskForm } from "../redux/useTaskForm";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const localizer = momentLocalizer(moment);

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  return (
    <div className="rbc-toolbar">
      <div className="flex items-center gap-4">
        <button onClick={goToBack} className="hover:bg-bg-tertiary p-2 rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg">{toolbar.label}</span>
        <button onClick={goToNext} className="hover:bg-bg-tertiary p-2 rounded-lg">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => toolbar.onView('month')}
          className={toolbar.view === 'month' ? 'rbc-active' : ''}
        >
          Month
        </button>
        <button
          onClick={() => toolbar.onView('week')}
          className={toolbar.view === 'week' ? 'rbc-active' : ''}
        >
          Week
        </button>
        <button
          onClick={() => toolbar.onView('day')}
          className={toolbar.view === 'day' ? 'rbc-active' : ''}
        >
          Day
        </button>
        <button
          onClick={() => toolbar.onView('agenda')}
          className={toolbar.view === 'agenda' ? 'rbc-active' : ''}
        >
          Agenda
        </button>
      </div>
    </div>
  );
};

const CustomEvent = ({ event, view, onSelectTask }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onSelectTask(event.taskId);
  };

  return (
    <div className="task-dot" onClick={handleClick}>
      <span className="sr-only">{event.title}</span>
    </div>
  );
};

const CustomDayPropGetter = (date) => {
  return {
    className: 'custom-day-cell',
    style: {}
  };
};

const Calendar = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const {
    newTask,
    error,
    handleSubmit,
    updateField,
    setNewTask,
  } = useTaskForm("");

  const handleSelectTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
    }
  };

  // Filtrar tareas incompletas y asignar índices
  const incompleteTasks = tasks
    .filter(task => !task.completed)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Agrupar tareas por fecha
  const tasksByDate = incompleteTasks.reduce((acc, task) => {
    const date = task.deadline;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});

  // Crear eventos agrupados
  const events = Object.entries(tasksByDate).map(([date, tasks]) => ({
    title: tasks.map(t => t.title).join(', '),
    description: tasks.map(t => t.description).join('\n'),
    start: new Date(date),
    end: new Date(date),
    allDay: true,
    color: "#0466C8",
    taskId: tasks[0].id, // Usar el ID de la primera tarea para el clic
    tasks: tasks // Guardar todas las tareas del día
  }));

  const handleDayClick = (slotInfo) => {
    const dateString = moment(slotInfo.start).format("YYYY-MM-DD");
    setSelectedDate(slotInfo.start);
    updateField("deadline", dateString);
    setShowModal(true);
  };

  const handleCalendarSubmit = async (e) => {
    const success = await handleSubmit(e);
    if (success) {
      setShowModal(false);
      setNewTask({ title: "", description: "", deadline: "" });
    }
  };

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (selectedTask) {
          setSelectedTask(null);
        } else if (showModal) {
          setShowModal(false);
        }
      }
    };

    if (selectedTask || showModal) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedTask, showModal]);

  return (
    <div className="maincard relative">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "500px", borderRadius: "10px" }}
        selectable
        onSelectSlot={handleDayClick}
        className="dark-calendar"
        components={{
          toolbar: CustomToolbar,
          event: (props) => <CustomEvent {...props} onSelectTask={handleSelectTask} />
        }}
        views={{
          month: true,
          week: true,
          day: true,
          agenda: true
        }}
        formats={{
          timeGutterFormat: () => '',
          dayFormat: 'ddd DD',
          eventTimeRangeFormat: () => ''
        }}
        dayPropGetter={CustomDayPropGetter}
        onSelectEvent={(event) => {
          setHoveredEvent(event);
          handleSelectTask(event.taskId);
        }}
        onNavigate={() => setHoveredEvent(null)}
      />

      {hoveredEvent && (
        <div className="absolute bg-neutral-900 p-4 rounded-lg shadow-lg z-50 max-w-xs border border-neutral-800">
          <div className="text-base text-neutral-300 mb-2">
            Tasks for {moment(hoveredEvent.start).format("LL")}
          </div>
          {hoveredEvent.tasks.map((task, index) => (
            <div key={task.id} className="mb-2">
              <div className="font-medium text-neutral-200">
                {task.title}
              </div>
              {task.description && (
                <div className="text-base text-neutral-400">
                  {task.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTask(null);
            }
          }}
        >
          <div className="maincard max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-center flex-1">
                Task Details
              </h3>
              <button
                className="text-gray-400 hover:text-white transition duration-200"
                onClick={() => setSelectedTask(null)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Title</h4>
                <p className="text-text-secondary">{selectedTask.title}</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Description</h4>
                <p className="text-text-secondary whitespace-pre-wrap">{selectedTask.description || 'No description'}</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Status</h4>
                <p className="text-text-secondary">
                  {selectedTask.completed ? 'Completed' : 'Pending'}
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Difficulty</h4>
                <p className={`text-text-secondary ${
                  selectedTask.difficulty === 'easy' ? 'text-green-500' :
                  selectedTask.difficulty === 'medium' ? 'text-blue-500' :
                  'text-red-500'
                }`}>
                  {selectedTask.difficulty.charAt(0).toUpperCase() + selectedTask.difficulty.slice(1)}
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Assignment</h4>
                <p className="text-text-secondary">
                  {selectedTask.assignment || 'No assignment'}
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Deadline</h4>
                <p className="text-text-secondary">
                  {new Date(selectedTask.deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Created At</h4>
                <p className="text-text-secondary">
                  {moment(selectedTask.created_at).format('MMMM D, YYYY h:mm A')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
        >
          <div className="maincard">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition duration-200"
              onClick={() => setShowModal(false)}
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-center">
              New Task for{" "}
              <span className="text-blue-400">
                {moment(selectedDate).format("LL")}
              </span>
            </h3>

            {error && (
              <div className="text-red-400 mb-4 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCalendarSubmit} className="space-y-5">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
                className="textinput"
              />

              <textarea
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="textinput"
                rows="4"
              />

              <input
                type="date"
                value={newTask.deadline}
                disabled
                className="textinput"
              />

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  className="cancelbutton"
                  onClick={() => setShowModal(false)}
                >
                    Cancel
                </button>
                <button
                  type="submit"
                  className="button"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Calendar;
