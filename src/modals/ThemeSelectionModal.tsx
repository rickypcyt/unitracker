import { Monitor, Moon, Sun, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface ThemeSelectionModalProps {
  onClose: () => void;
  onThemeSelect: (theme: 'light' | 'dark' | 'auto') => void;
}

const ThemeSelectionModal: React.FC<ThemeSelectionModalProps> = ({ onClose, onThemeSelect }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleThemeSelect = (theme: 'light' | 'dark' | 'auto') => {
    onThemeSelect(theme);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div
        ref={modalRef}
        className={`bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl border border-[var(--border-primary)]/50 w-full max-w-md mx-1 sm:mx-2 md:mx-4 p-4 sm:p-6 md:p-8 relative shadow-2xl overflow-hidden transition-all duration-700 transform ${
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
            Choose your theme
          </h2>
          
          <p className="text-sm sm:text-base text-[var(--text-secondary)] text-center leading-relaxed px-3 sm:px-0">
            Select how you want UniTracker to appear
          </p>
        </div>
        
        {/* Theme Options */}
        <div className="space-y-3 sm:space-y-4 relative z-10">
          <button
            onClick={() => handleThemeSelect('light')}
            className="w-full group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10 active:scale-[0.98]"
          >
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 dark:from-yellow-400/10 dark:to-orange-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] mb-1">Light Mode</h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm">Bright and clean interface</p>
            </div>
          </button>
          
          <button
            onClick={() => handleThemeSelect('dark')}
            className="w-full group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10 active:scale-[0.98]"
          >
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] mb-1">Dark Mode</h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm">Easy on the eyes at night</p>
            </div>
          </button>
          
          <button
            onClick={() => handleThemeSelect('auto')}
            className="w-full group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10 active:scale-[0.98]"
          >
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] mb-1">System</h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm">Follow your device settings</p>
            </div>
          </button>
        </div>
        
        {/* Skip option */}
        <div className="flex justify-center mt-6 sm:mt-8 relative z-10">
          <button
            onClick={onClose}
            className="text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelectionModal;
