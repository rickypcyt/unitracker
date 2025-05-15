import { ChevronDown, ChevronUp } from "lucide-react";

export const TaskCategorySection = ({ title, taskCount, isOpen, onToggle, children }) => (
  <div className={`space-y-4 ${title.toLowerCase().includes("complete") ? "" : "mb-4"}`}>
    <button className="infomenu mb-3" onClick={onToggle}>
      <span>{title} ({taskCount})</span>
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
    <div
      className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${
        isOpen ? "visible" : "hidden"
      }`}
    >
      {children}
    </div>
  </div>
);
