import { useState } from 'react';

export const useCalendarState = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [focusedDate, setFocusedDate] = useState(new Date());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  return {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    focusedDate,
    setFocusedDate,
    showTaskForm,
    setShowTaskForm,
    isLoginPromptOpen,
    setIsLoginPromptOpen,
    isInfoModalOpen,
    setIsInfoModalOpen,
    lastTap,
    setLastTap,
  };
};