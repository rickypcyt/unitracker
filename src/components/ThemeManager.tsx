import { useEffect } from "react";
import useTheme from "@/hooks/useTheme";

const ThemeManager = () => {
  const { toggleTheme } = useTheme();

  // -------------------------
  // Keyboard shortcuts
  // -------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && /^m$/i.test(e.key)) {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  return null; // This component doesn't render anything
};

export default ThemeManager;
