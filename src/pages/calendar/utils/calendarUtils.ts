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

  if (tapLength < 300 && tapLength > 0) {
    // Double tap detected - reduced threshold for better mobile experience
    if (date) {
      handleDateDoubleClick(date);
    }
  } else {
    // Single tap - provide haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  setLastTap(currentTime);
};

// Handle long press for context menu on mobile
export const handleLongPress = (
  e: React.TouchEvent,
  date: Date,
  onLongPress: (date: Date) => void
) => {
  const touchDuration = 500; // 500ms for long press
  let timeoutId: NodeJS.Timeout;

  const handleTouchStart = () => {
    timeoutId = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50); // Longer vibration for long press
      }
      onLongPress(date);
    }, touchDuration);
  };

  const handleTouchMove = () => {
    clearTimeout(timeoutId);
  };

  const handleTouchEnd = () => {
    clearTimeout(timeoutId);
  };

  // Add event listeners for this specific touch
  const element = e.currentTarget;
  element.addEventListener('touchstart', handleTouchStart, { once: true });
  element.addEventListener('touchmove', handleTouchMove, { once: true });
  element.addEventListener('touchend', handleTouchEnd, { once: true });
};

// Improved swipe detection for calendar navigation
export const handleSwipe = (
  e: React.TouchEvent,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void
) => {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const minSwipeDistance = 50; // Minimum distance for swipe

  const handleTouchStart = (event: Event) => {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.changedTouches?.[0];
    if (touch) {
      touchStartX = touch.screenX;
      touchStartY = touch.screenY;
    }
  };

  const handleTouchEnd = (event: Event) => {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.changedTouches?.[0];
    if (touch) {
      touchEndX = touch.screenX;
      touchEndY = touch.screenY;
      handleSwipeGesture();
    }
  };

  const handleSwipeGesture = () => {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if swipe is horizontal or vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
  };

  // Add event listeners
  const element = e.currentTarget;
  element.addEventListener('touchstart', handleTouchStart, { once: true });
  element.addEventListener('touchend', handleTouchEnd, { once: true });
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
  setIsLoginPromptOpen: (open: boolean) => void,
  setSelectedTask?: (task: null) => void
) => {
  e.stopPropagation();
  if (!isLoggedIn) {
    setIsLoginPromptOpen(true);
    return;
  }

  // Clear any selected task when creating a new task
  if (setSelectedTask) {
    setSelectedTask(null);
  }

  // Create new date with the clicked day and hour
  const newDate = new Date(day);
  newDate.setHours(hour, 0, 0, 0);

  setSelectedDate(newDate);
  setFocusedDate(newDate);
  
  // Store the hour in sessionStorage for TaskForm to use
  sessionStorage.setItem('calendarTaskHour', hour.toString());
  
  setShowTaskForm(true);
};

// Handle date double click with authentication and date validation
export const handleDateDoubleClick = (
  date: Date,
  isLoggedIn: boolean,
  setSelectedDate: (date: Date) => void,
  setIsLoginPromptOpen: (open: boolean) => void,
  setShowTaskForm: (show: boolean) => void
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  setSelectedDate(date);
  if (date < today) return;
  if (!isLoggedIn) return setIsLoginPromptOpen(true);
  setShowTaskForm(true);
};