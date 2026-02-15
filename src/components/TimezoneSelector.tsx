import { COMMON_TIMEZONES, filterTimezones, getPreferredTimezone, getTimezoneLabel, getUserTimezone, setPreferredTimezone } from '@/utils/timezoneUtils';
import { ChevronDown, Clock, Globe } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface TimezoneSelectorProps {
  selectedTimezone?: string;
  onTimezoneChange?: (timezone: string) => void;
  className?: string;
  showCurrentTime?: boolean;
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  selectedTimezone,
  onTimezoneChange,
  className = '',
  showCurrentTime = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the current selected timezone
  const currentTz = selectedTimezone || getPreferredTimezone();
  const userTz = getUserTimezone();

  // Filter timezones based on search
  const filteredTimezones = searchTerm 
    ? filterTimezones(searchTerm)
    : COMMON_TIMEZONES;

  // Update current time every second if showCurrentTime is enabled
  useEffect(() => {
    if (!showCurrentTime) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [showCurrentTime]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get dropdown position for fixed positioning
  const getDropdownPosition = () => {
    if (!dropdownRef.current) return { top: 0, left: 0 };
    
    const rect = dropdownRef.current.getBoundingClientRect();
    const dropdownHeight = 384; // max-h-96 = 24rem = 384px
    
    return {
      top: rect.top + window.scrollY - dropdownHeight - 4, // Position above with 4px gap
      left: rect.left + window.scrollX
    };
  };

  const handleTimezoneSelect = (timezone: string) => {
    setPreferredTimezone(timezone);
    onTimezoneChange?.(timezone);
    setIsOpen(false);
    setSearchTerm('');
  };

  const formatCurrentTime = (timezone: string) => {
    try {
      return currentTime.toLocaleString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return currentTime.toLocaleTimeString();
    }
  };

  const isSystemTimezone = currentTz === userTz;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-sm text-[var(--text-primary)]"
        aria-label="Select timezone"
      >
        <Globe size={16} />
        <span className="truncate max-w-[200px]">
          {getTimezoneLabel(currentTz)}
        </span>
        {isSystemTimezone && (
          <span className="text-xs text-[var(--text-secondary)]">(System)</span>
        )}
        {showCurrentTime && (
          <span className="text-xs text-[var(--accent-primary)] font-mono">
            {formatCurrentTime(currentTz)}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
            }}
          />
          
          {/* Dropdown Content */}
          <div 
            className="fixed z-50 w-80 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-96 overflow-hidden"
            style={{
              top: `${getDropdownPosition().top}px`,
              left: `${getDropdownPosition().left}px`,
            }}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-[var(--border-primary)]">
              <input
                type="text"
                placeholder="Search timezone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                autoFocus
              />
            </div>

            {/* System Timezone Option */}
            <div className="border-b border-[var(--border-primary)]">
              <button
                onClick={() => handleTimezoneSelect(userTz)}
                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left ${
                  currentTz === userTz ? 'bg-[var(--accent-primary)]10' : ''
                }`}
              >
                <Clock size={16} className="text-[var(--text-secondary)]" />
                <div className="flex-1">
                  <div className="text-sm text-[var(--text-primary)] font-medium">
                    System Timezone
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {getTimezoneLabel(userTz)}
                  </div>
                </div>
                {currentTz === userTz && (
                  <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full" />
                )}
              </button>
            </div>

            {/* Timezone List */}
            <div className="overflow-y-auto max-h-64">
              {filteredTimezones.map((timezone) => (
                <button
                  key={timezone.value}
                  onClick={() => handleTimezoneSelect(timezone.value)}
                  className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left ${
                    currentTz === timezone.value ? 'bg-[var(--accent-primary)]10' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-sm text-[var(--text-primary)]">
                      {timezone.label}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {timezone.value}
                    </div>
                  </div>
                  {currentTz === timezone.value && (
                    <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full" />
                  )}
                </button>
              ))}

              {filteredTimezones.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-[var(--text-secondary)]">
                  No timezones found matching "{searchTerm}"
                </div>
              )}
            </div>

            {/* Current Time Display */}
            {showCurrentTime && (
              <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
                <div className="text-xs text-[var(--text-secondary)] mb-1">Current time in selected timezone:</div>
                <div className="text-sm font-mono text-[var(--text-primary)]">
                  {formatCurrentTime(currentTz)}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TimezoneSelector;
