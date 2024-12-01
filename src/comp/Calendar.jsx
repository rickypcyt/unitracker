import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useSelector } from "react-redux";

const Calendar = () => {
  const tasks = useSelector((state) => state.tasks.tasks); // Asegúrate de acceder a las tareas correctamente

  const events = tasks.map((task) => ({
    title: task.title,
    date: task.deadline,
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      events={events}
    />
  );
};

export default Calendar;
