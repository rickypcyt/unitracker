import BaseMenu from '@/modals/BaseMenu';

export const ColumnMenu = ({
  x,
  y,
  assignment,
  onAddTask,
  onSortClick,
  onTogglePin,
  onClose,
  pinned,
  tasks
}) => {
  const optionStyle = {
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    backgroundColor: 'var(--bg-secondary)',
  };

  const handleAddTask = () => {
    onAddTask();
    onClose();
  };

  const handleSortTasks = () => {
    onSortClick(assignment, { x, y });
    onClose();
  };

  const handleTogglePin = () => {
    onTogglePin();
    onClose();
  };

  return (
    <BaseMenu
      x={x}
      y={y}
      onClose={onClose}
      aria-label="Column options"
      className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] z-[9999]"
    >
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li
          style={optionStyle}
          className="hover:bg-[var(--bg-primary)] transition-colors duration-75"
          onClick={handleAddTask}
        >
          Add Task
        </li>
        <li
          style={optionStyle}
          className="hover:bg-[var(--bg-primary)] transition-colors duration-75"
          onClick={handleSortTasks}
        >
          Sort Tasks
        </li>
        <li
          style={optionStyle}
          className="hover:bg-[var(--bg-primary)] transition-colors duration-75"
          onClick={handleTogglePin}
        >
          {pinned ? 'Unpin Column' : 'Pin Column'}
        </li>
        <li
          style={optionStyle}
          className="hover:bg-[var(--bg-primary)] transition-colors duration-75"
        >
          {tasks.length} tasks
        </li>
      </ul>
    </BaseMenu>
  );
}; 