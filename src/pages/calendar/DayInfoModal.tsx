import { CheckCircle2, Clock } from "lucide-react";

import BaseModal from "@/modals/BaseModal";
import { formatDate } from "@/utils/dateUtils";

interface DayInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  tasks: any[];
  studiedHours: string | number;
}

const DayInfoModal = ({ isOpen, onClose, date, tasks, studiedHours }: DayInfoModalProps) => {
  if (!isOpen) return null;

  const completedTasks = tasks?.filter((t: any) => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={formatDate(date.toISOString())}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tasks Card */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-primary)]/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={20} className="text-[var(--accent-primary)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--text-secondary)] font-medium">Tasks</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {completedTasks}/{totalTasks}
                </div>
              </div>
            </div>
          </div>

          {/* Study Time Card */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-primary)]/20 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-[var(--accent-primary)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--text-secondary)] font-medium">Study Time</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {studiedHours || 0}h
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task List */}
        {tasks && tasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <div className="w-1 h-4 bg-[var(--accent-primary)] rounded-full"></div>
              Tasks Overview
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)]/80 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.completed ? "bg-green-500" : "bg-yellow-500"
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      task.completed
                        ? "text-[var(--text-secondary)] line-through"
                        : "text-[var(--text-primary)]"
                    }`}>
                      <span className="text-base">{task.title}</span>
                    </div>
                    {task.assignment && (
                      <div className="text-xs text-[var(--text-secondary)] truncate">
                        {task.assignment}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    task.completed
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {task.completed ? "Done" : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!tasks || tasks.length === 0) && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-[var(--text-secondary)]" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm">No tasks recorded for this day</p>
            <p className="text-[var(--text-secondary)]/60 text-xs mt-2">Take a look at other days for activity</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default DayInfoModal;