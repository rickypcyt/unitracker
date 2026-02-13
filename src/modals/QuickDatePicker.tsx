import 'react-datepicker/dist/react-datepicker.css';

import { Calendar, Clock, X } from 'lucide-react';
import React, { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';

import DatePicker from 'react-datepicker';

interface QuickDatePickerProps {
  task: any;
  onClose: () => void;
  onSave: (task: any) => void;
}

export const QuickDatePicker: React.FC<QuickDatePickerProps> = ({
  task,
  onClose,
  onSave
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (task.deadline) {
      // Handle DD/MM/YYYY format
      if (task.deadline.includes('/')) {
        const [day, month, year] = task.deadline.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        return new Date(task.deadline);
      }
    }
    return null;
  });
  
  const [endTime, setEndTime] = useState(() => {
    if (task.end_at) {
      // Convert 24h to 12h format
      const [hours, minutes] = task.end_at.split(':');
      const hoursNum = parseInt(hours);
      const period = hoursNum >= 12 ? 'PM' : 'AM';
      const displayHour = hoursNum === 0 ? 12 : (hoursNum > 12 ? hoursNum - 12 : hoursNum);
      return `${displayHour}:${minutes} ${period}`;
    }
    return '11:00 AM';
  });

  // Close on click outside and Escape
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
      
      // Convert time limit to 24h format and set as end_at (deadline time)
      const convertTo24h = (time12h: string) => {
        const [timeStr = '', period = ''] = time12h.split(' ');
        const [hoursStr = '0', minutesStr = '0'] = timeStr.split(':');
        const hours = parseInt(hoursStr);
        const minutes = parseInt(minutesStr);
        let h = hours;
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      };
      
      updatedTask.end_at = convertTo24h(endTime); // Time limit as deadline
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

  const incrementTime = (time: string) => {
    const [timeStr = '', period = ''] = time.split(' ');
    const [hoursStr = '0', minutesStr = '0'] = timeStr.split(':');
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    let newMinutes = minutes + 30;
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newMinutes -= 60;
      newHours = (newHours + 1) % 12;
      if (newHours === 0 && period === 'PM' && hours === 11) {
        // Switch from PM to AM
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} AM`;
      } else if (newHours === 0 && period === 'AM' && hours === 11) {
        // Switch from AM to PM
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} PM`;
      }
    }
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} ${period}`;
  };

  const decrementTime = (time: string) => {
    const [timeStr = '', period = ''] = time.split(' ');
    const [hoursStr = '0', minutesStr = '0'] = timeStr.split(':');
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    let newMinutes = minutes - 30;
    let newHours = hours;
    
    if (newMinutes < 0) {
      newMinutes += 60;
      newHours = newHours - 1 < 0 ? 11 : newHours - 1;
      if (newHours === 11 && period === 'AM' && hours === 0) {
        // Switch from AM to PM
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} PM`;
      } else if (newHours === 11 && period === 'PM' && hours === 0) {
        // Switch from PM to AM
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} AM`;
      }
    }
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[320px] rounded-lg bg-[var(--bg-primary)] p-4 shadow-xl"
      style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
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
