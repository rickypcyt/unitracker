import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useSelector } from "react-redux";
import "./Calendar.css"; // Import the updated CSS file

const Calendar = () => {
  const tasks = useSelector((state) => state.tasks.tasks); // Access tasks from Redux state

  // Filter tasks with a deadline and map to calendar events
  const events = tasks
    .filter((task) => task.deadline) // Only tasks with a deadline
    .map((task) => ({
      title: task.title,
      date: task.deadline, // Using the deadline as the event date
    }));

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        contentHeight={500} // Adjust content height for better appearance
      />
    </div>
  );
};

export default Calendar;
