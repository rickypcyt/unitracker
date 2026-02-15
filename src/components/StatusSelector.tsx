import { useEffect, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { id: 'not_started', label: 'Not Started', color: 'text-gray-400' },
  { id: 'on_hold', label: 'On Hold', color: 'text-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'text-yellow-500' },
  { id: 'active', label: 'Active', color: 'text-green-500' },
];

interface StatusSelectorProps {
  selectedStatus?: string;
  onStatusChange: (status: string) => void;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  selectedStatus = 'not_started',
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

  const currentStatus = STATUS_OPTIONS.find(opt => opt.id === selectedStatus) || STATUS_OPTIONS[0];

  const handleSelectStatus = (status: string) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  // Ensure we always have valid values
  const statusColor = currentStatus?.color ?? STATUS_OPTIONS[0]?.color ?? 'text-gray-400';
  const statusLabel = currentStatus?.label ?? STATUS_OPTIONS[0]?.label ?? 'Unknown';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-20">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectStatus(option.id)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-secondary)] transition-colors text-left ${
                  selectedStatus === option.id ? 'bg-[var(--bg-secondary)]' : ''
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${option.color.replace('text', 'bg')} opacity-60`}></div>
                <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
                {selectedStatus === option.id && (
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
