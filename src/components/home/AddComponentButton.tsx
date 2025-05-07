import React, { useState } from "react";
import { Plus } from "lucide-react";
import { ComponentRegistry } from "../../utils/componentRegistry";
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

  // 1. Obtener todos los componentes activos en el layout
  const activeComponents = new Set(layout.flatMap((col) => col.items));

  // 2. Filtrar solo los componentes que NO están activos
  const availableComponents = Object.entries(ComponentRegistry).filter(
    ([key]) => !activeComponents.has(key),
  );

  // 3. Manejar el click para mostrar menú o toast
  const handleButtonClick = () => {
    if (availableComponents.length === 0) {
      toast.info("All components are being used.");
      setShowMenu(false);
    } else {
      setShowMenu((s) => !s);
    }
  };

  return (
    <div className="relative flex justify-center">
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-accent-primary/80 text-accent-primary hover:text-white rounded-md border border-accent-primary transition"
        onClick={handleButtonClick}
      >
        <Plus size={16} />
        Add Component
      </button>
      {showMenu && availableComponents.length > 0 && (
        <div className="absolute z-50 mt-2 bg-neutral-900 border border-neutral-700 rounded shadow-lg min-w-[180px]">
          {availableComponents.map(([key, config]) => (
            <button
              key={key}
              className="w-full text-left px-4 py-2 hover:bg-accent-primary/20 transition"
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
