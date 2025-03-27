import { useState } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useTaskForm } from "../redux/useTaskForm";
import { X } from "lucide-react";

const localizer = momentLocalizer(moment);

const Calendar = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const {
    newTask,
    error,
    handleSubmit,
    updateField,
    setNewTask,
  } = useTaskForm("");

  const events = tasks.map((task) => ({
    title: task.title,
    start: new Date(task.deadline),
    end: new Date(task.deadline),
    allDay: true,
    color: task.completed ? "#023E7D" : "#0466C8",
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

  return (
    <div className="maincard">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "500px", borderRadius: "10px" }}
        selectable
        onSelectSlot={handleDayClick}
      />

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
