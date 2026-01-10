import { useEffect } from 'react';

interface UseCalendarKeyboardProps {
  focusedDate: Date;
  currentDate: Date;
  setFocusedDate: (date: Date) => void;
  setSelectedDate: (date: Date) => void;
  setCurrentDate: (date: Date) => void;
  handleDateDoubleClick: (date: Date) => void;
}

export const useCalendarKeyboard = ({
  focusedDate,
  currentDate,
  setFocusedDate,
  setSelectedDate,
  setCurrentDate,
  handleDateDoubleClick,
}: UseCalendarKeyboardProps) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const newDate = new Date(focusedDate);
      switch (e.key) {
        case "ArrowLeft":
          newDate.setDate(newDate.getDate() - 1);
          break;
        case "ArrowRight":
          newDate.setDate(newDate.getDate() + 1);
          break;
        case "ArrowUp":
          newDate.setDate(newDate.getDate() - 7);
          break;
        case "ArrowDown":
          newDate.setDate(newDate.getDate() + 7);
          break;
        case "Enter":
          handleDateDoubleClick(focusedDate);
          return;
        default:
          return;
      }
      setFocusedDate(newDate);
      setSelectedDate(newDate);
      if (
        newDate.getMonth() !== currentDate.getMonth() ||
        newDate.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [focusedDate, currentDate, setFocusedDate, setSelectedDate, setCurrentDate, handleDateDoubleClick]);
};