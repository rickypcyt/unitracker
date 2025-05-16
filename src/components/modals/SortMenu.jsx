import React from "react";
import { ArrowUpDown } from "lucide-react";

export const SortMenu = ({ sortBy, onSortChange, showSortMenu, setShowSortMenu }) => {
  return (
    <div className="relative">
      <button
        onClick={() => setShowSortMenu(!showSortMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors duration-200"
      >
        <ArrowUpDown size={16} />
        Sort by{" "}
        <span style={{ color: "var(--accent-primary)" }}>
          {sortBy === "default"
            ? "Default"
            : sortBy === "assignment"
            ? "Assignment"
            : sortBy === "deadline"
            ? "Deadline"
            : sortBy === "difficulty"
            ? "Difficulty"
            : sortBy === "alphabetical"
            ? "A-Z"
            : ""}
        </span>
      </button>
      {showSortMenu && (
        <div className="sort-menu absolute right-0 mt-2 w-48 bg-neutral-900 rounded-lg shadow-lg z-10 border border-neutral-800">
          <SortOption label="Default" value="default" currentSort={sortBy} onClick={onSortChange} />
          <SortOption label="Assignment" value="assignment" currentSort={sortBy} onClick={onSortChange} />  
          <SortOption label="Deadline" value="deadline" currentSort={sortBy} onClick={onSortChange} />
          <SortOption label="Difficulty" value="difficulty" currentSort={sortBy} onClick={onSortChange} />
          <SortOption label="Alphabetical" value="alphabetical" currentSort={sortBy} onClick={onSortChange} />
        </div>
      )}
    </div>
  );
};

const SortOption = ({ label, value, currentSort, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${
      currentSort === value ? "bg-neutral-800" : ""
    }`}
  >
    {label}
  </button>
);
