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
  const menuStyle = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 1000,
    backgroundColor: '#262626', // Neutral 800
    border: '1px solid #404040', // Neutral 700
    borderRadius: '0.5rem', // rounded-lg
    padding: '0.5rem 0', // Padding top/bottom, none left/right for list items
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    minWidth: '120px', // Minimum width for the menu
  };

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
      className += ' font-semibold text-blue-500';
    } else if (optionType === 'direction' && currentSortDirection === optionValue) {
      className += ' font-semibold text-blue-500';
    }
    return className;
  };

  return (
    <div style={menuStyle} onMouseLeave={onClose} // Close when mouse leaves the menu area
    >
      {/* Optional: Add a header */}
      {/* <div style={{ padding: '0.5rem 1rem', fontWeight: 'bold', color: '#a3a3a3', borderBottom: '1px solid #404040' }}>
        Sort By
      </div> */}
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
        {/* Add other sorting options here */}

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
    </div>
  );
}; 