import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type SortOption = 'name-asc' | 'name-desc' | 'count-asc' | 'count-desc';

interface SortOptionConfig {
  id: SortOption;
  label: string;
  description: string;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { id: 'name-asc', label: 'Name (A-Z)', description: 'Order alphabetically' },
  { id: 'name-desc', label: 'Name (Z-A)', description: 'Order alphabetically reversed' },
  { id: 'count-desc', label: 'Most Tasks', description: 'Most tasks first' },
  { id: 'count-asc', label: 'Fewest Tasks', description: 'Fewest tasks first' },
];

interface AssignmentSortMenuProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const AssignmentSortMenu: React.FC<AssignmentSortMenuProps> = ({
  currentSort,
  onSortChange,
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

  const currentOption = SORT_OPTIONS.find(opt => opt.id === currentSort);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)]/80 transition-colors"
      >
        <ArrowUpDown className="w-4 h-4 text-[var(--text-secondary)]" />
        <span className="text-[var(--text-primary)]">{currentOption?.label || 'Sort'}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50">
          <div className="py-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onSortChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] transition-colors ${
                  currentSort === option.id ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-[var(--text-secondary)]">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
