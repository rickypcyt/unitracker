import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useSelector } from "react-redux";
import "./Calendar.css"; // Import the new CSS file

const Calendar = () => {
  const tasks = useSelector((state) => state.tasks.tasks); // Access tasks from Redux state

  const events = tasks
    .filter((task) => task.deadline) // Ensure only tasks with a deadline are included
    .map((task) => ({
      title: task.title,
      date: task.deadline, // This assumes the deadline is in a compatible format
    }));

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        contentHeight={500} // Adjust height for better appearance
      />
    </div>
  );
};

export default Calendar;
