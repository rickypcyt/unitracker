import React from "react";
import { Info, Play, Trash2 } from "lucide-react";

export const TaskListMenu = ({
  contextMenu,
  onClose,
  onDoubleClick,
  onSetActiveTask,
  onDeleteTask,
}) => {
  if (!contextMenu) return null;

  return (
    <div
      className="fixed bg-neutral-900 p-2 rounded-lg shadow-lg z-50 border border-neutral-800"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      <div className="space-y-1">
        <button
          onClick={() => {
            onDoubleClick(contextMenu.task);
            onClose();
          }}
          className="w-full px-2 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 rounded-md flex items-center gap-2"
        >
          <Info size={16} />
          Edit Task
        </button>
        {contextMenu.task.activetask ? (
          <button
            onClick={() => {
              onSetActiveTask({
                ...contextMenu.task,
                activetask: false,
              });
              onClose();
            }}
            className="w-full px-2 py-2 text-left text-sm text-yellow-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
          >
            <Play size={16} className="rotate-180" />
            Deactivate Task
          </button>
        ) : (
          <button
            onClick={() => {
              onSetActiveTask({
                ...contextMenu.task,
                activetask: true,
              });
              onClose();
            }}
            className="w-full px-2 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 rounded-md flex items-center gap-2"
          >
            <Play size={16} />
            Set as Active Task
          </button>
        )}
        <button
          onClick={() => {
            onDeleteTask(contextMenu.task.id);
            onClose();
          }}
          className="w-full px-2 py-2 text-left text-sm text-red-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete Task
        </button>
      </div>
    </div>
  );
};
