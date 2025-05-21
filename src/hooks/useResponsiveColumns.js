import { useState, useEffect } from "react";

export function useResponsiveColumns(maxColumns = 4) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    function updateColumns() {
      if (typeof window === "undefined") return; // SSR safe
      const width = window.innerWidth;
      let newColumns = 1;
      if (width < 640) newColumns = 1; // Mobile
      else if (width < 1024) newColumns = 2; // Tablet
      else if (width < 1400) newColumns = 3; // Desktop
      else newColumns = 4; // Extra large

      newColumns = Math.min(newColumns, maxColumns); // Nunca más que maxColumns

      setColumns((prev) => (prev !== newColumns ? newColumns : prev));
    }
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [maxColumns]);

  return columns;
}
