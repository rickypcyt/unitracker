import React, { useState, useRef, useEffect } from "react";
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

  // 1. Obtener todos los componentes activos en el layout
  const activeComponents = new Set(layout.flatMap((col) => col.items));

  // 2. Filtrar solo los componentes que NO están activos
  const availableComponents = Object.entries(ComponentRegistry).filter(
    ([key]) => !activeComponents.has(key)
  );

  // 3. Manejar click fuera para cerrar menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // 4. Manejar el click para mostrar menú o toast
  const handleButtonClick = () => {
    if (availableComponents.length === 0) {
      toast.info("All components are being used.");
      setShowMenu(false);
    } else {
      setShowMenu((s) => !s);
    }
  };

  return (
    <div
      ref={containerRef}
      className=""
      style={{ width: "100%" }}
    >
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
          className="absolute z-50 mt-3 w-full max-w-full rounded-2xl p-4 shadow-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {availableComponents.map(([key, config]) => (
            <button
              key={key}
              role="menuitem"
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent-primary/20 transition font-medium"
              onClick={() => {
                onClick(key);
                setShowMenu(false);
              }}
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
