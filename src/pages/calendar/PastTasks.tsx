import { Calendar } from 'lucide-react';
import { TaskItem } from '@/pages/tasks/TaskItem';
import useDemoMode from '@/utils/useDemoMode';
import { useSelector } from 'react-redux';
import { useTaskManager } from '@/hooks/useTaskManager';

const PastTasks = () => {
  const { handleToggleCompletion, handleDeleteTask, handleUpdateTask } = useTaskManager(undefined);
  const realTasks = useSelector((state: any) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleContextMenu = () => {
    // No-op for context menu in PastTasks
  };

  // Past tasks: deadline < today and not completed (only if deadline exists)
  const pastTasks = tasks
    .filter((task: any) => {
      if (!task.deadline || task.deadline === '' || task.deadline === null) return false;
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today && !task.completed;
    })
    .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div className="maincard mt-3">
      <div className="flex justify-center items-center">
        <div className="section-title">
          <Calendar size={22} className="icon" />
          <span>Past Tasks</span>
        </div>
      </div>

      {pastTasks.length === 0 ? (
        <p className="text-[var(--text-secondary)]">No past tasks</p>
      ) : (
        <div className="space-y-2 mt-3">
          {pastTasks.map((task: any) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleCompletion={handleToggleCompletion}
              onDelete={handleDeleteTask}
              onEditTask={() => handleUpdateTask(task)}
              onContextMenu={handleContextMenu}
              showAssignment={true}
              assignmentLeftOfDate={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PastTasks;
