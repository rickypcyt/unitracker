import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { ComponentRegistry } from "../../utils/layoutManager";
import { toast } from "react-toastify";

interface AddComponentButtonProps {
  onClick: (componentKey: string) => void;
  layout: { id: string; items: string[] }[];
}

const AddComponentButton: React.FC<AddComponentButtonProps> = ({
  onClick,
  layout,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoizar los componentes activos y disponibles para evitar cálculos innecesarios
  const activeComponents = useMemo(
    () => new Set(layout.flatMap((col) => col.items)),
    [layout]
  );

  const availableComponents = useMemo(
    () =>
      Object.entries(ComponentRegistry).filter(
        ([key]) => !activeComponents.has(key)
      ),
    [activeComponents]
  );

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Manejar click en el botón principal
  const handleButtonClick = () => {
    if (availableComponents.length === 0) {
      toast.info("All components are being used.", {
        autoClose: 2000,
        pauseOnHover: false,
        containerId: "main-toast-container",
      });
      setShowMenu(false);
    } else {
      setShowMenu((prev) => !prev);
    }
  };

  // Manejar selección de componente
  const handleSelectComponent = (key: string) => {
    onClick(key);
    setShowMenu(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        className="flex items-center gap-2 px-6 py-4 bg-black hover:bg-accent-primary/80 text-accent-primary hover:text-white rounded-xl border border-accent-primary transition w-full justify-center font-semibold"
        onClick={handleButtonClick}
        aria-haspopup="true"
        aria-expanded={showMenu}
        aria-controls="add-component-menu"
      >
        <Plus size={18} />
        Add Component
      </button>

      {showMenu && availableComponents.length > 0 && (
        <div
          id="add-component-menu"
          role="menu"
          className="absolute left-0 z-50 mt-3 w-full rounded-2xl p-4 shadow-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {availableComponents.map(([key, config]) => (
            <button
              key={key}
              role="menuitem"
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent-primary/20 transition font-medium"
              onClick={() => handleSelectComponent(key)}
            >
              {config.title || key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddComponentButton;
