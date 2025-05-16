import React, { useState } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Days of the week in English
  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  // Month names in English
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday as start of week
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const daysInPreviousMonth = getDaysInMonth(year, month - 1);
    const days = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPreviousMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({ date, day, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        day: i,
        currentMonth: true,
        isToday: isToday(date),
        isSelected: isSelected(date),
      });
    }

    // Next month days
    const totalDaysDisplayed =
      Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    const daysFromNextMonth = totalDaysDisplayed - days.length;

    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, day: i, currentMonth: false });
    }

    return days;
  };

  return (
    <div className="maincard">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FaCalendarAlt size={24} />
          Calendar
        </h2>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-0 hover:bg-neutral-0 text-white transition-colors duration-200">
          <button
            onClick={goToPreviousMonth}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            <FaChevronLeft />
          </button>
          <div className="text-lg font-medium mx-4 ">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button
            onClick={goToNextMonth}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="bg-black rounded-lg text-white">
        {/* Month and Year header with navigation icons */}

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center ">
          {weekdays.map((day, index) => (
            <div
              key={index}
              className="text-neutral-500 text-base w-full py-4 flex items-center justify-center "
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 text-center">
          {renderCalendarDays().map((dayObj, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(dayObj.date)}
              style={{
                ...(dayObj.isToday ? { color: "var(--accent-primary)" } : {}),
                ...(dayObj.currentMonth ? {} : { color: "grey" }),
                // Aquí agregas otras propiedades si es necesario
                fontWeight: "bold", // Ejemplo de propiedad adicional
              }}
              className={`text-neutral-500 select-none hover:text-gray-600 cursor-default text-base w-full py-4 flex items-center justify-center  ${dayObj.currentMonth ? "text-white font-bold" : "text-black hover:text-[var(--accent-primary)] "} ${!dayObj.currentMonth ? "text-black font-bold" : ""}

              ${dayObj.isToday ? "select-none hover:text-gray-600 cursor-default " : ""}`}
            >
              {dayObj.day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
