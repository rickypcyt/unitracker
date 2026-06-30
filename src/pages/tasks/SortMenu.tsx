import BaseMenu from '@/modals/BaseMenu';

interface SortMenuProps {
  x: number;
  y: number;
  assignmentId: string;
  onSelectSort: (assignmentId: string, sortType: string, direction: string) => void;
  onClose: () => void;
  currentSortType?: string;
  currentSortDirection?: string;
}

export const SortMenu = ({
  x,
  y,
  assignmentId,
  onSelectSort,
  onClose,
  currentSortType = 'deadline',
  currentSortDirection = 'asc'
}: SortMenuProps) => {
  const optionStyle = {
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    backgroundColor: 'var(--bg-secondary)',
  };

  const handleOptionClick = (sortOption: string) => () => {
    onSelectSort(assignmentId, sortOption, currentSortDirection);
    onClose();
  };

  const handleDirectionClick = (direction: string) => () => {
    if (currentSortType) {
      onSelectSort(assignmentId, currentSortType, direction);
    } else {
      onSelectSort(assignmentId, 'deadline', direction);
    }
    onClose();
  };

  const getOptionClassName = (optionType: string, optionValue: string) => {
    let className = "hover:bg-[var(--bg-primary)] transition-colors duration-75";
    if (optionType === 'type' && currentSortType === optionValue) {
      className += ' font-semibold text-[var(--accent-primary)] border border-[var(--accent-primary)] bg-transparent';
    } else if (optionType === 'direction' && currentSortDirection === optionValue) {
      className += ' font-semibold text-[var(--accent-primary)] border border-[var(--accent-primary)] bg-transparent';
    }
    return className;
  };

  return (
    <BaseMenu
      x={x}
      y={y}
      onClose={onClose}
      aria-label="Sort options"
      className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] z-[9999]"
    >
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li
          style={optionStyle}
          className={getOptionClassName('type', 'alphabetical')}
          onClick={handleOptionClick('alphabetical')}
        >
          Alphabetical (A-Z)
        </li>
        <li
          style={optionStyle}
          className={getOptionClassName('type', 'deadline')}
          onClick={handleOptionClick('deadline')}
        >
          Deadline
        </li>
        <li
          style={optionStyle}
          className={getOptionClassName('type', 'difficulty')}
          onClick={handleOptionClick('difficulty')}
        >
          Difficulty
        </li>
        <li
          style={optionStyle}
          className={getOptionClassName('type', 'dateAdded')}
          onClick={handleOptionClick('dateAdded')}
        >
          Date Added
        </li>

        {/* Separator */}
        <li style={{ height: '1px', backgroundColor: 'var(--border-primary)', margin: '0.5rem 0' }}></li>

        {/* Direction Options */}
        <li
          style={optionStyle}
          className={getOptionClassName('direction', 'asc')}
          onClick={handleDirectionClick('asc')}
        >
          Ascending
        </li>
        <li
          style={optionStyle}
          className={getOptionClassName('direction', 'desc')}
          onClick={handleDirectionClick('desc')}
        >
          Descending
        </li>
      </ul>
    </BaseMenu>
  );
}; 