import 'react-datepicker/dist/react-datepicker.css';

import { Calendar, Clock, X } from 'lucide-react';
import React, { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { decrementTime, incrementTime, to12Hour, to24Hour } from '@/utils/timeUtils';

import DatePicker from 'react-datepicker';
import { parseDateFromString } from '@/utils/dateUtils';

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
    if (!task.deadline) return null;
    const parsed = parseDateFromString(task.deadline);
    return parsed;
  });
  
  const [startTime, setStartTime] = useState(() => {
    if (task.start_at) {
      return to12Hour(task.start_at);
    }
    return '8:00 AM';
  });

  const [endTime, setEndTime] = useState(() => {
    if (task.end_at) {
      return to12Hour(task.end_at);
    }
    return '9:00 AM';
  });

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
      // Convert to DD/MM/YYYY format (same as TaskForm)
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const dateStr = `${day}/${month}/${year}`;

      // Set deadline in DD/MM/YYYY format
      updatedTask.deadline = dateStr;
      updatedTask.due_date = dateStr;

      // Convert start time to timestamptz format using the deadline date
      const start24 = to24Hour(startTime);
      if (start24) {
        const timeParts = start24.split(':');
        const hours = timeParts[0] || '0';
        const minutes = timeParts[1] || '0';

        // Create timestamp manually to avoid timezone conversion
        const dateStr = `${year}-${month}-${day}`;
        updatedTask.start_at = `${dateStr} ${hours}:${minutes}:00+00`;
      }

      // Convert end time to timestamptz format using the deadline date
      const end24 = to24Hour(endTime);
      if (end24) {
        const timeParts = end24.split(':');
        const hours = timeParts[0] || '0';
        const minutes = timeParts[1] || '0';

        // Create timestamp manually to avoid timezone conversion
        const dateStr = `${year}-${month}-${day}`;
        updatedTask.end_at = `${dateStr} ${hours}:${minutes}:00+00`;
      }
    } else {
      updatedTask.deadline = '';
      updatedTask.due_date = '';
      updatedTask.start_at = null;
      updatedTask.end_at = null;
    }

    onSave(updatedTask);
    onClose();
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setStartTime('8:00 AM');
    setEndTime('9:00 AM');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        ref={menuRef}
        className="min-w-[320px] max-w-md rounded-lg bg-[var(--bg-primary)] p-4 shadow-xl border-2 border-[var(--border-primary)]"
        style={{
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

      {/* Time - Only show if date is selected */}
      {selectedDate && (
        <div className="border-t border-[var(--border-primary)] pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[var(--text-primary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Task Time</span>
          </div>
          
          <div className="max-w-xs mx-auto space-y-3">
            {/* Task Start Time */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Task Start Time
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStartTime(decrementTime(startTime))}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-colors"
                >
                  −
                </button>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-center"
                  placeholder="8:00 AM"
                />
                <button
                  onClick={() => setStartTime(incrementTime(startTime))}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Task End Time */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Task End Time
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
                  placeholder="9:00 AM"
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
    </div>
  );
};
