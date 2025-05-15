import React, { useState } from "react";
import { TaskItem } from "./TaskItem";
import { TaskListMenu } from "../modals/TaskListMenu";
import ContextMenu from "../modals/ContextMenu";
import { SortMenu } from "../modals/SortMenu";
import { useTaskManager } from "../../hooks/useTaskManager";
import { useSorting } from "../../hooks/useSorting";
import { useTaskDetails } from "../../hooks/useTaskDetails";
import { ClipboardCheck, ChevronUp, ChevronDown } from "lucide-react";

export const TaskList = ({ onComponentContextMenu }) => {
  const {
    user,
    tasks,
    localTasks,
    handleToggleCompletion,
    handleDeleteTask,
    handleUpdateTask,
  } = useTaskManager();

  const {
    sortBy,
    setSortBy,
    showSortMenu,
    setShowSortMenu,
    sortTasks,
  } = useSorting();

  const {
    selectedTask,
    editedTask,
    taskDetailsEdit,
    handleOpenTaskDetails,
    handleCloseTaskDetails,
    setTaskEditing,
    setEditedTask,
    handleSaveEdit,
    handleEditChange,
  } = useTaskDetails();

  // Estado único para menús contextuales
  const [contextMenu, setContextMenu] = useState(null);

  // Visibilidad de secciones
  const [showIncomplete, setShowIncomplete] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  // Definir tareas según usuario
  const allTasks = user ? tasks : localTasks;
  const completedTasks = allTasks.filter((task) => task.completed);
  const incompleteTasks = allTasks.filter((task) => !task.completed);

  // Handlers para menús contextuales
  const handleTaskContextMenu = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: "task",
      x: e.clientX,
      y: e.clientY,
      task,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  return (
    <div className="maincard relative">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck size={24} />
            Task List
          </h2>
          <div className="relative">
            <SortMenu
              sortBy={sortBy}
              onSortChange={(value) => {
                setSortBy(value);
                setShowSortMenu(false);
              }}
              showSortMenu={showSortMenu}
              setShowSortMenu={setShowSortMenu}
            />
          </div>
        </div>
      </div>

      {/* Mensaje si no hay tareas */}
      {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="plslogin">You have no tasks at the moment.</div>
      ) : (
        <>
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-4 mb-4">
              <button className="infomenu mb-3" onClick={() => setShowIncomplete((v) => !v)}>
                <span>Incomplete Tasks ({incompleteTasks.length})</span>
                {showIncomplete ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <div
                className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${
                  showIncomplete ? "visible" : "hidden"
                }`}
              >
                {sortTasks(incompleteTasks).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleCompletion={handleToggleCompletion}
                    onDelete={handleDeleteTask}
                    onDoubleClick={handleOpenTaskDetails}
                    onContextMenu={(e) => handleTaskContextMenu(e, task)}
                    isEditing={taskDetailsEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <button className="infomenu mb-3" onClick={() => setShowCompleted((v) => !v)}>
                <span>Completed Tasks ({completedTasks.length})</span>
                {showCompleted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <div
                className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${
                  showCompleted ? "visible" : "hidden"
                }`}
              >
                {sortTasks(completedTasks).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleCompletion={handleToggleCompletion}
                    onDelete={handleDeleteTask}
                    onDoubleClick={handleOpenTaskDetails}
                    onContextMenu={(e) => handleTaskContextMenu(e, task)}
                    isEditing={taskDetailsEdit}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          selectedTask={selectedTask}
          editedTask={editedTask}
          isEditing={taskDetailsEdit}
          onClose={handleCloseTaskDetails}
          onEdit={(value) => {
            setTaskEditing(value);
            if (!value) setEditedTask(null);
          }}
          onSave={handleSaveEdit}
          onDelete={handleDeleteTask}
          onToggleCompletion={handleToggleCompletion}
          onSetActiveTask={handleUpdateTask}
          onEditChange={handleEditChange}
        />
      )}

      {/* Renderiza SOLO el menú contextual adecuado */}
      {contextMenu && contextMenu.type === "task" && (
        <TaskListMenu
          contextMenu={contextMenu}
          onClose={handleCloseContextMenu}
          onDoubleClick={handleOpenTaskDetails}
          onSetActiveTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      )}
      {/* El de componentes/layouts se maneja desde Home */}
    </div>
  );
};

export default TaskList;
