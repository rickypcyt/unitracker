// src/components/TaskForm.js
import { useTaskForm } from './useTaskForm';

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
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg  mr-2 ml-2">
      <h2 className="text-2xl font-bold mb-6 text-text-primary">Add New Task</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && <div className="text-accent-secondary text-sm mb-3 text-left bg-bg-surface p-3 rounded-lg">{error}</div>}

        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-text-secondary text-sm">Task Title</label>
          <input
            id="title"
            className={`w-full p-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 ${error && !newTask.title ? "border-accent-secondary focus:ring-accent-secondary" : ""}`}
            value={newTask.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter task title"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-text-secondary text-sm">Description (optional)</label>
          <textarea
            id="description"
            className="w-full p-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 min-h-[50px]"
            value={newTask.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Enter task description"
          />
        </div>
      
        <div className="flex flex-col gap-2">
          <label htmlFor="deadline" className="text-text-secondary text-sm">Deadline</label>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="px-4 py-2 bg-accent-tertiary text-text-primary rounded-lg hover:bg-accent-deep transition-colors duration-200 flex-grow"
              onClick={handleSetToday}
            >
              Today
            </button>
            <input
              id="deadline"
              className={`flex-grow p-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 ${error && !newTask.deadline ? "border-accent-secondary focus:ring-accent-secondary" : ""}`}
              type="date"
              value={newTask.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
            />
            <button
              type="button"
              className="px-4 py-2 bg-accent-tertiary text-text-primary rounded-lg hover:bg-accent-deep transition-colors duration-200 flex-grow"
              onClick={handleSetTomorrow}
            >
              Tomorrow
            </button>
          </div>
        </div>

        <button type="submit" className="w-full mt-6 p-4 bg-accent-primary text-text-primary rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-deep hover:shadow-lg active:translate-y-0.5">
          Add Task
        </button>
      </form>
    </div>
  );
};

export default TaskForm;