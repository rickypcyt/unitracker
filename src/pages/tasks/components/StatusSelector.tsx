import { useEffect, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { TASK_STATUSES, normalizeTaskStatus } from '@/constants/taskStatus';

interface StatusSelectorProps {
  selectedStatus?: string;
  onStatusChange: (status: string) => void;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  selectedStatus = 'todo',
  onStatusChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedStatus = normalizeTaskStatus(selectedStatus);
  const currentStatus = TASK_STATUSES.find(opt => opt.id === normalizedStatus) || TASK_STATUSES[0]!;

  const handleSelectStatus = (status: string) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  // Ensure we always have valid values
  const statusColor = currentStatus.textColor;
  const statusLabel = currentStatus.label;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${statusColor.replace('text', 'bg')} opacity-60`}></div>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Status: {statusLabel}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg shadow-lg z-20">
            {TASK_STATUSES.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectStatus(option.id)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-secondary)] transition-colors text-left ${
                  normalizedStatus === option.id ? 'bg-[var(--bg-secondary)]' : ''
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${option.bgColor} opacity-60`}></div>
                <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
                {normalizedStatus === option.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[var(--accent-primary)]"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
