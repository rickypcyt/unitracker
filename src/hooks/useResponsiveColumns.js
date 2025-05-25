import { useState, useEffect } from "react";

export function useResponsiveColumns() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    function updateColumns() {
      if (typeof window === "undefined") return; // SSR safe
      const width = window.innerWidth;
      let newColumns = 1;
      if (width < 640) newColumns = 1; // Mobile
      else if (width < 1024) newColumns = 2; // Tablet
      else newColumns = 3; // Desktop and larger

      setColumns((prev) => (prev !== newColumns ? newColumns : prev));
    }
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
}
