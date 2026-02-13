import 'react-datepicker/dist/react-datepicker.css';

import { Calendar, Clock, X } from 'lucide-react';
import React, { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { decrementTime, incrementTime, to12Hour, to24Hour } from '@/utils/timeUtils';

import DatePicker from 'react-datepicker';

interface QuickDatePickerProps {
  task: any;
  onClose: () => void;
  onSave: (task: any) => void;
  position?: { x: number; y: number };
}

export const QuickDatePicker: React.FC<QuickDatePickerProps> = ({
  task,
  onClose,
  onSave,
  position
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (task.deadline) {
      // Handle DD/MM/YYYY format
      if (task.deadline.includes('/')) {
        const [day, month, year] = task.deadline.split('/');
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        // Validate date components
        if (!isNaN(dayNum) && !isNaN(monthNum) && !isNaN(yearNum)) {
          if (monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
            const date = new Date(yearNum, monthNum - 1, dayNum);
            // Check if date is valid (day exists in month)
            if (!isNaN(date.getTime()) && date.getDate() === dayNum) {
              return date;
            }
          }
        }
        console.error('Invalid date in task.deadline:', task.deadline);
        return null;
      } else {
        const date = new Date(task.deadline);
        return isNaN(date.getTime()) ? null : date;
      }
    }
    return null;
  });
  
  const [endTime, setEndTime] = useState(() => {
    if (task.end_at) {
      return to12Hour(task.end_at);
    }
    return '11:00 AM';
  });

  // Calculate position based on click location or fallback to right side
  const getPosition = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (position) {
      const menuWidth = 320; // min-w-[320px]
      const menuHeight = 400; // estimated height
      
      let x = position.x;
      let y = position.y - 200; // Move 200px up from click
      
      // Adjust horizontal position if menu would go off screen
      if (x + menuWidth > windowWidth) {
        x = Math.max(10, windowWidth - menuWidth - 10);
      }
      
      // Adjust vertical position if menu would go off screen
      if (y + menuHeight > windowHeight) {
        y = Math.max(10, windowHeight - menuHeight - 10);
      }
      
      // Ensure menu doesn't go above top of screen
      if (y < 10) {
        y = position.y + 20; // Show below if no space above
      }
      
      return { x, y };
    }
    
    // Fallback to right side center
    return { x: windowWidth - 340, y: windowHeight / 2 - 200 };
  };

  const pos = getPosition();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside as unknown as EventListener);
    document.addEventListener('keydown', handleEscape as unknown as EventListener);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener);
      document.removeEventListener('keydown', handleEscape as unknown as EventListener);
    };
  }, [onClose]);

  const handleSave = () => {
    const updatedTask = { ...task };
    
    if (selectedDate) {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      updatedTask.deadline = `${day}/${month}/${year}`;
      
      updatedTask.end_at = to24Hour(endTime) + ':00'; // Time limit as deadline
      updatedTask.start_at = null; // No start time needed for deadline
    } else {
      updatedTask.deadline = '';
      updatedTask.start_at = null;
      updatedTask.end_at = null;
    }
    
    onSave(updatedTask);
    onClose();
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setEndTime('11:00 AM');
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[320px] rounded-lg bg-[var(--bg-primary)] p-4 shadow-xl"
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        border: '2px solid var(--border-primary)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-[var(--text-primary)]" />
          <span className="font-medium text-[var(--text-primary)]">Set Date & Time</span>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Calendar */}
      <div className="mb-4">
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          dateFormat="dd/MM/yyyy"
          placeholderText="Select date"
          inline
          calendarClassName="bg-[var(--bg-primary)] border-0 text-[var(--text-primary)] w-full"
          dayClassName={(date: Date) =>
            date.getDay() === 0 || date.getDay() === 6 ? 'text-red-500' : ''
          }
        />
      </div>

      {/* Clear Date Button */}
      <div className="mb-4">
        <button
          onClick={handleClearDate}
          className="w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
        >
          Clear Date
        </button>
      </div>

      {/* Time Limit - Only show if date is selected */}
      {selectedDate && (
        <div className="border-t border-[var(--border-primary)] pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[var(--text-primary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Time Limit/Deadline</span>
          </div>
          
          <div className="max-w-xs mx-auto">
            {/* Time Limit */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Time Limit/Deadline
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEndTime(decrementTime(endTime))}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-colors"
                >
                  −
                </button>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-center"
                  placeholder="11:00 AM"
                />
                <button
                  onClick={() => setEndTime(incrementTime(endTime))}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-primary)]">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-2 text-sm text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 rounded-md transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};
