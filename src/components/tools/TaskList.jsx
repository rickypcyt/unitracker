import React, { useState } from "react";
import { TaskItem } from "./TaskItem";
import { TaskListMenu } from "../modals/TaskListMenu";
import { SortMenu } from "../modals/SortMenu";
import { useTaskManager } from "../../hooks/useTaskManager";
import { useSorting } from "../../hooks/useSorting";
import { useTaskDetails } from "../../hooks/useTaskDetails";
import { ClipboardCheck, ChevronUp, ChevronDown } from "lucide-react";
import TaskDetailsModal from "../modals/TaskDetailsModal";

// Agrupa tareas por assignment
const groupTasksByAssignment = (tasks) => {
  return tasks.reduce((acc, task) => {
    const assignment = task.assignment || "No assignment";
    if (!acc[assignment]) acc[assignment] = [];
    acc[assignment].push(task);
    return acc;
  }, {});
};

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

  const [contextMenu, setContextMenu] = useState(null);

  // Estado para mostrar/ocultar assignments dentro de la sección incompleta
  const [openAssignments, setOpenAssignments] = useState({});
  // Estado para plegar/desplegar la sección de completadas
  const [showCompleted, setShowCompleted] = useState(false);

  // Definir tareas según usuario
  const allTasks = user ? tasks : localTasks;
  const completedTasks = allTasks.filter((task) => task.completed);
  const incompletedTasks = allTasks.filter((task) => !task.completed);

  // Agrupar por assignment
  const incompletedByAssignment = groupTasksByAssignment(incompletedTasks);
  const completedByAssignment = groupTasksByAssignment(completedTasks);

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

  // Toggle para cada assignment en la sección incompleta
  const handleToggleAssignment = (assignment) => {
    setOpenAssignments((prev) => ({
      ...prev,
      [assignment]: !prev[assignment],
    }));
  };

  // --- PROGRESS TRACKER LOGIC ---
  const milestones = [5, 10, 15, 20, 25];
  const completedCount = completedTasks.length;
  const totalCount = allTasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getNextMilestone = () => {
    return milestones.find((milestone) => milestone > completedCount) || "All";
  };

  const getProductivity = () => {
    const today = new Date();
    return allTasks.filter(
      (task) =>
        task.completed &&
        task.completedAt &&
        new Date(task.completedAt).toDateString() === today.toDateString()
    ).length;
  };

  // --- END PROGRESS TRACKER LOGIC ---

  return (
    <div className="maincard relative flex flex-col gap-2 p-6">
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
      {incompletedTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="plslogin">You have no tasks at the moment.</div>
      ) : (
        <>
          {/* Assignments (incomplete tasks) */}
          <div className="space-y-4 mb-4">
            {Object.keys(incompletedByAssignment).length === 0 ? (
              <div className="text-text-secondary">No incomplete assignments.</div>
            ) : (
              Object.entries(incompletedByAssignment).map(([assignment, tasks]) => (
                <div key={assignment} className="mb-2">
                  <button
                    className="infomenu mb-1"
                    onClick={() => handleToggleAssignment(assignment)}
                  >
                    <span>
                      {assignment} ({tasks.length})
                    </span>
                    {openAssignments[assignment] ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                  <div
                    className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${
                      openAssignments[assignment] ? "visible" : "hidden"
                    }`}
                  >
                    {sortTasks(tasks).map((task) => (
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
              ))
            )}
          </div>

          {/* Completed Tasks (plegable) */}
          <div className="space-y-5 mb-4">
            <button
              className="infomenu mb-3"
              onClick={() => setShowCompleted((v) => !v)}
            >
              <span>Completed Tasks ({completedTasks.length})</span>
              {showCompleted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <div
              className={`transition-all duration-300 ${
                showCompleted ? "visible" : "hidden"
              }`}
            >
              {Object.keys(completedByAssignment).length === 0 ? (
                <div className="text-text-secondary ml-2">No completed tasks.</div>
              ) : (
                Object.entries(completedByAssignment).map(([assignment, tasks]) => (
                  <div key={assignment} className="mb-2 ml-2">
                    <div className="font-semibold text-base mb-1">{assignment} ({tasks.length})</div>
                    <div className="space-y-2">
                      {sortTasks(tasks).map((task) => (
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
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* PROGRESS TRACKER (integrado al final de la tarjeta) */}
      <div className=" px-3 rounded-lg bg-black/80 ">

        <div className="flex items-center mb-2">
          <div className="flex-1 h-2 bg-neutral-800 rounded overflow-hidden">
            <div
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: "#2563eb",
              }}
              className="h-2 transition-all duration-500 rounded"
            ></div>
          </div>
          <span className="ml-3 text-blue-500 font-semibold text-sm">{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-end gap-2 justify-center mb-2">
          <span className="text-2xl font-bold text-blue-500">{completedCount}</span>
          <span className="text-lg font-medium text-white">out of</span>
          <span className="text-2xl font-bold text-white">{totalCount}</span>
          <span className="text-lg font-medium text-white">tasks completed</span>
        </div>

      </div>

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
    </div>
  );
};

export default TaskList;
