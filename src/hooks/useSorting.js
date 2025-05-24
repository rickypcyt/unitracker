import { useState } from "react";

export const useSorting = () => {
  const [sortBy, setSortBy] = useState("default");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortTasks = (tasks) => {
    switch (sortBy) {
      case "assignment":
        return [...tasks].sort((a, b) => {
          if (!a.assignment && !b.assignment) return 0;
          if (!a.assignment) return 1;
          if (!b.assignment) return -1;
          return a.assignment.localeCompare(b.assignment);
        });
      case "deadline":
        return [...tasks].sort(
          (a, b) => new Date(a.deadline) - new Date(b.deadline)
        );
      case "difficulty":
        { const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
        return [...tasks].sort(
          (a, b) =>
            difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        ); }
      case "alphabetical":
        return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return tasks;
    }
  };

  return { sortBy, setSortBy, showSortMenu, setShowSortMenu, sortTasks };
};
