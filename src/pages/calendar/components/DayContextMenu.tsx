import { Plus } from "lucide-react";

import BaseMenu from "@/modals/BaseMenu";
import { format12Hour } from "../utils/calendarUtils";

interface DayContextMenuProps {
  x: number;
  y: number;
  date: Date;
  hour?: number;
  disabled?: boolean;
  onClose: () => void;
  onCreateEvent: () => void;
}

const DayContextMenu = ({
  x,
  y,
  date,
  hour,
  disabled = false,
  onClose,
  onCreateEvent,
}: DayContextMenuProps) => {
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const label = hour !== undefined ? `${dateLabel} · ${format12Hour(hour)}` : dateLabel;

  return (
    <BaseMenu
      x={Math.min(x, window.innerWidth - 240)}
      y={Math.min(y, window.innerHeight - 120)}
      onClose={onClose}
      aria-label="Day options"
    >
      <div className="space-y-1">
        <div className="px-2 pb-1.5 text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </div>
        <button
          onClick={() => {
            onCreateEvent();
            onClose();
          }}
          disabled={disabled}
          className="w-full px-2 py-2 text-left text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-all duration-200 hover:ring-2 hover:ring-[var(--accent-primary)] hover:ring-opacity-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus size={16} />
          Create event
        </button>
      </div>
    </BaseMenu>
  );
};

export default DayContextMenu;
