// Format 12-hour time
export const format12Hour = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  return `${displayHour}:00 ${period}`;
};

// Handle touch end for double tap detection
export const handleTouchEnd = (
  e: React.TouchEvent,
  date: Date,
  lastTap: number,
  setLastTap: (time: number) => void,
  handleDateDoubleClick: (date: Date) => void
) => {
  e.preventDefault();
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;

  if (tapLength < 500 && tapLength > 0) {
    // Double tap detected
    if (date) {
      handleDateDoubleClick(date);
    }
  }

  setLastTap(currentTime);
};

// Handle adding task with authentication check
export const handleAddTask = (
  e: React.MouseEvent,
  day: Date,
  hour: number,
  isLoggedIn: boolean,
  setSelectedDate: (date: Date) => void,
  setFocusedDate: (date: Date) => void,
  setShowTaskForm: (show: boolean) => void,
  setIsLoginPromptOpen: (open: boolean) => void
) => {
  e.stopPropagation();
  if (!isLoggedIn) {
    setIsLoginPromptOpen(true);
    return;
  }

  // Create new date with the clicked day and hour
  const newDate = new Date(day);
  newDate.setHours(hour, 0, 0, 0);

  setSelectedDate(newDate);
  setFocusedDate(newDate);
  setShowTaskForm(true);
};

// Handle date double click with authentication and date validation
export const handleDateDoubleClick = (
  date: Date,
  isLoggedIn: boolean,
  setSelectedDate: (date: Date) => void,
  setIsLoginPromptOpen: (open: boolean) => void,
  setShowTaskForm: (show: boolean) => void,
  setIsInfoModalOpen: (open: boolean) => void
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  setSelectedDate(date);
  if (date < today) return setIsInfoModalOpen(true);
  if (!isLoggedIn) return setIsLoginPromptOpen(true);
  setShowTaskForm(true);
};