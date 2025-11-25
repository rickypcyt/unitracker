import { Check, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface AccentColorModalProps {
  onClose: () => void;
  onAccentColorSelect: (color: string) => void;
}

const ACCENT_COLORS = [
  { name: 'Blue', value: '#0A84FF', description: 'Classic blue' },
  { name: 'Purple', value: '#BF5AF2', description: 'Creative purple' },
  { name: 'Pink', value: '#FF2D92', description: 'Playful pink' },
  { name: 'Orange', value: '#FF9F0A', description: 'Energetic orange' },
  { name: 'Green', value: '#30D158', description: 'Fresh green' },
  { name: 'Red', value: '#FF453A', description: 'Bold red' },
  { name: 'Teal', value: '#40C0E5', description: 'Calm teal' },
  { name: 'Indigo', value: '#5E5CE6', description: 'Deep indigo' },
];

const AccentColorModal: React.FC<AccentColorModalProps> = ({ onClose, onAccentColorSelect }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#0A84FF');

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    
    // Trigger animation on mount
    setTimeout(() => setIsAnimating(true), 100);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onAccentColorSelect(color);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div
        ref={modalRef}
        className={`bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl border border-[var(--border-primary)]/50 w-full max-w-2xl mx-1 sm:mx-2 md:mx-4 p-4 sm:p-6 md:p-8 relative shadow-2xl overflow-hidden transition-all duration-700 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] overflow-y-auto`}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-primary)]/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-3 sm:p-2 rounded-full bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 group active:scale-95"
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform duration-200" />
        </button>
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 relative z-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 text-center">
            Choose your accent color
          </h2>
          
          <p className="text-sm sm:text-base text-[var(--text-secondary)] text-center leading-relaxed px-3 sm:px-0">
            Pick a color that reflects your style
          </p>
        </div>
        
        {/* Color Options */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10 mb-6 sm:mb-8">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              className={`group relative p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)]/30 border-2 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10 active:scale-[0.98] ${
                selectedColor === color.value
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50'
              }`}
            >
              {/* Color preview */}
              <div className="flex items-center justify-center mb-3">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: color.value }}
                />
              </div>
              
              {/* Selected indicator */}
              {selectedColor === color.value && (
                <div className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              )}
              
              {/* Color info */}
              <div className="text-center">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] mb-1">
                  {color.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {color.description}
                </p>
              </div>
            </button>
          ))}
        </div>
        
        {/* Skip option */}
        <div className="flex justify-center relative z-10">
          <button
            onClick={onClose}
            className="text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
          >
            Use default color
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccentColorModal;
