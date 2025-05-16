import { useState, useEffect } from "react";

export function useResponsiveColumns() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    function updateColumns() {
      const width = window.innerWidth;
      if (width < 640) setColumns(1); // Mobile
      else if (width < 1024) setColumns(2); // Tablet
      else if (width < 1400) setColumns(3); // Desktop
      else setColumns(4); // Extra large
    }
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
}
