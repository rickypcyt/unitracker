import { ArrowUpDown } from "lucide-react";

export const SortMenu = ({ sortBy, onSortChange, showSortMenu, setShowSortMenu }) => {
  return (
    <div className="relative">
      <button
        onClick={() => setShowSortMenu(!showSortMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] transition-all duration-200 hover:shadow-md"
      >
        <ArrowUpDown size={16} className="text-[var(--text-secondary)]" />
        Sort by{" "}
        <span className="text-[var(--accent-primary)] font-medium">
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
            : sortBy === "dateAdded"
            ? "Date Added"
            : ""}
        </span>
      </button>
      {showSortMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-primary)] rounded-lg shadow-lg z-10 border border-[var(--border-primary)] overflow-hidden">
          <SortOption label="Default" value="default" currentSort={sortBy} onClick={onSortChange} />
          <SortOption label="Assignment" value="assignment" currentSort={sortBy} onClick={onSortChange} />  
          <SortOption label="Deadline" value="deadline" currentSort={sortBy} onClick={onSortChange} />
          <SortOption label="Difficulty" value="difficulty" currentSort={sortBy} onClick={onSortChange} />
          <SortOption label="Alphabetical" value="alphabetical" currentSort={sortBy} onClick={onSortChange} />
          <SortOption label="Date Added" value="dateAdded" currentSort={sortBy} onClick={onSortChange} />
        </div>
      )}
    </div>
  );
};

const SortOption = ({ label, value, currentSort, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`block px-4 py-2 w-full text-left text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200 ${
      currentSort === value ? "bg-[var(--bg-secondary)] text-[var(--accent-primary)] font-medium" : ""
    }`}
  >
    {label}
  </button>
);
