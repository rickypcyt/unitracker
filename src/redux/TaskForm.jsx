import { useTaskForm } from './useTaskForm';
import './TaskForm.css';

const TaskForm = () => {
  const {
    newTask,
    error,
    handleSubmit,
    updateField,
    handleSetToday,
    handleSetTomorrow
  } = useTaskForm();

  return (
    <div className="task-form-container">
      <form className="task-form" onSubmit={handleSubmit}>
        {error && <div className="task-form-error-message">{error}</div>}

        <div className="task-input-group">
          <input
            className={`task-input ${error && !newTask.title ? "task-input-error" : ""}`}
            value={newTask.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter task title"
            required
          />
        </div>

        <input
          className="task-input"
          value={newTask.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Enter task description (optional)"
        />
      
      <div className="task-date-group">
        <button
          type="button"
          className="today-button"
          onClick={handleSetToday}
        >
          Today
        </button>
        <input
          className={`task-input ${error && !newTask.deadline ? "task-input-error" : ""}`}
          type="date"
          value={newTask.deadline}
          onChange={(e) => updateField('deadline', e.target.value)}
        />
        <button
          type="button"
          className="tomorrow-button"
          onClick={handleSetTomorrow}
        >
          Tomorrow
        </button>
      </div>

      <button type="submit" className="task-submit-button">
        Add Task
      </button>
    </form>
  </div>
  );
};

export default TaskForm;