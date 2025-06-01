import BaseMenu from '../common/BaseMenu';
import React from 'react';

export const SortMenu = ({
  x,
  y,
  assignmentId,
  onSelectSort,
  onClose,
  currentSortType = 'alphabetical',
  currentSortDirection = 'asc'
}) => {
  const optionStyle = {
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    color: '#d4d4d4', // Neutral 300
    fontSize: '0.9rem',
  };

  const handleOptionClick = (sortOption) => () => {
    onSelectSort(assignmentId, sortOption, currentSortDirection);
    onClose();
  };

  const handleDirectionClick = (direction) => () => {
    if (currentSortType) {
      onSelectSort(assignmentId, currentSortType, direction);
    } else {
      onSelectSort(assignmentId, 'alphabetical', direction);
    }
    onClose();
  };

  const getOptionClassName = (optionType, optionValue) => {
    let className = "hover:bg-neutral-700/50 transition-colors duration-100";
    if (optionType === 'type' && currentSortType === optionValue) {
      className += ' font-semibold text-[var(--accent-primary)]';
    } else if (optionType === 'direction' && currentSortDirection === optionValue) {
      className += ' font-semibold text-[var(--accent-primary)]';
    }
    return className;
  };

  return (
    <BaseMenu
      x={x}
      y={y}
      onClose={onClose}
      aria-label="Sort options"
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
        <li style={{ height: '1px', backgroundColor: '#404040', margin: '0.5rem 0' }}></li>

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