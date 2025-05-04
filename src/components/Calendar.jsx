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
            <div className="flex items-center mb-4">
                <FaCalendarAlt className="mr-2 text-white text-xl" />
                <h2 className="text-xl font-bold text-white">Calendar</h2>
            </div>

            <div className="bg-black rounded-lg text-white pb-4">
                {/* Month and Year header with navigation icons */}
                <div className="flex justify-center items-center py-6">
                    <button
                        onClick={goToPreviousMonth}
                        className="text-white hover:text-gray-300 focus:outline-none"
                    >
                        <FaChevronLeft />
                    </button>
                    <div className="text-lg font-medium mx-4">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </div>
                    <button
                        onClick={goToNextMonth}
                        className="text-white hover:text-gray-300 focus:outline-none"
                    >
                        <FaChevronRight />
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 text-center mb-2">
                    {weekdays.map((day, index) => (
                        <div key={index} className="text-gray-400 text-sm">
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
                            className={`
                                py-2 cursor-pointer
                                ${dayObj.currentMonth ? "font-bold" : "text-gray-500"}
                                ${dayObj.isToday ? "bg-gray-800" : ""}
                                ${dayObj.isSelected ||
                                    (dayObj.date.getDate() === 4 &&
                                        dayObj.currentMonth)
                                    ? "rounded-full bg-gray-700"
                                    : ""
                                }
                            `}
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
