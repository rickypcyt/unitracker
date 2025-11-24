import { ArrowRight, BarChart2, Calendar, CheckCircle2, Clock, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Swipe down to close functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientY ?? null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientY ?? null);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isDownSwipe = distance < -50;
    if (isDownSwipe) {
      onClose();
    }
  };

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

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div
        ref={modalRef}
        className={`bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl border border-[var(--border-primary)]/50 w-full max-w-4xl mx-1 sm:mx-2 md:mx-4 p-4 sm:p-6 md:p-8 lg:px-10 lg:py-8 relative shadow-2xl overflow-hidden transition-all duration-700 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] overflow-y-auto`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-primary)]/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-3 sm:p-2 rounded-full bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 group active:scale-95"
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform duration-200 group-hover:rotate-90" />
        </button>
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-10 relative z-10">
          {/* Logo with animation */}
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <span className="text-[var(--text-primary)] font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">Uni</span>
            <span className="text-[var(--accent-primary)] font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Tracker</span>
          </div>
          
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-primary)] mb-2 sm:mb-3 text-center bg-gradient-to-r from-[var(--text-primary)] to-[var(--accent-primary)] bg-clip-text text-transparent px-2">
            Your all-in-one study companion
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] text-center max-w-2xl leading-relaxed px-3 sm:px-0">
            Organize your time, boost your productivity, and track your academic progress with a beautiful, modern, and intuitive app.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-10 relative z-10">
          <div className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10 active:scale-[0.98]">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-[var(--text-primary)]">AI Task Creation</h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm md:text-base leading-relaxed">Quickly create tasks with AI assistance. Let our intelligent system help you organize your study sessions efficiently.</p>
            </div>
          </div>
          
          <div className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10 active:scale-[0.98]">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-[var(--text-primary)]">Weekly & Monthly Stats</h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm md:text-base leading-relaxed">Track your progress and productivity with comprehensive analytics and beautiful visualizations.</p>
            </div>
          </div>
          
          <div className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10 active:scale-[0.98]">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-[var(--text-primary)]">Calendar Planning</h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm md:text-base leading-relaxed">Plan sessions and deadlines visually with our intuitive calendar system.</p>
            </div>
          </div>
          
          <div className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10 active:scale-[0.98]">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-[var(--text-primary)]">Advanced Task System</h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm md:text-base leading-relaxed">Organize with kanban board system and manage your workflow efficiently.</p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 relative z-10">
          <button
            className="group px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold text-sm sm:text-base md:text-lg cursor-pointer transition-all duration-300 hover:bg-[var(--accent-primary)] hover:text-white hover:shadow-xl hover:shadow-[var(--accent-primary)]/25 transform hover:scale-105 active:scale-[0.98] flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary)]/10 hover:from-[var(--accent-primary)] hover:to-[var(--accent-primary)] min-h-[44px] sm:min-h-[48px]"
            onClick={onClose}
          >
            Get Started
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] opacity-70 text-center px-4">
            Join thousands of students improving their productivity
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
