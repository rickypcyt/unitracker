import { ArrowRight, BarChart2, Calendar, CheckCircle2, Clock, Sparkles, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
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

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div
        ref={modalRef}
        className={`bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-primary)]/50 w-full max-w-4xl mx-2 sm:mx-4 p-6 sm:p-8 md:px-10 md:py-8 relative shadow-2xl overflow-hidden transition-all duration-700 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } max-h-[90vh] sm:max-h-[85vh] overflow-y-auto`}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-primary)]/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 group"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:rotate-90" />
        </button>
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8 sm:mb-10 relative z-10">
          {/* Logo with animation */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-[var(--accent-primary)] animate-pulse" />
              <span className="text-[var(--text-primary)] font-extrabold text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">Uni</span>
            </div>
            <span className="text-[var(--accent-primary)] font-extrabold text-3xl sm:text-4xl md:text-5xl">Tracker</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-3 text-center bg-gradient-to-r from-[var(--text-primary)] to-[var(--accent-primary)] bg-clip-text text-transparent">
            Your all-in-one study companion
          </h2>
          
          <p className="text-base sm:text-lg text-[var(--text-secondary)] text-center max-w-2xl leading-relaxed">
            Organize your time, boost your productivity, and track your academic progress with a beautiful, modern, and intuitive app.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10 relative z-10">
          <div className="group flex items-start gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg sm:text-xl mb-2 text-[var(--text-primary)]">AI Task Creation</h3>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">Quickly create tasks with AI assistance. Let our intelligent system help you organize your study sessions efficiently.</p>
            </div>
          </div>
          
          <div className="group flex items-start gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BarChart2 className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg sm:text-xl mb-2 text-[var(--text-primary)]">Weekly & Monthly Stats</h3>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">Track your progress and productivity with comprehensive analytics and beautiful visualizations.</p>
            </div>
          </div>
          
          <div className="group flex items-start gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg sm:text-xl mb-2 text-[var(--text-primary)]">Calendar Planning</h3>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">Plan sessions and deadlines visually with our intuitive calendar system.</p>
            </div>
          </div>
          
          <div className="group flex items-start gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg sm:text-xl mb-2 text-[var(--text-primary)]">Advanced Task System</h3>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">Organize with kanban board system and manage your workflow efficiently.</p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="flex flex-col items-center gap-4 relative z-10">
          <button
            className="group px-8 sm:px-12 py-4 sm:py-5 rounded-2xl border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold text-base sm:text-lg cursor-pointer transition-all duration-300 hover:bg-[var(--accent-primary)] hover:text-white hover:shadow-xl hover:shadow-[var(--accent-primary)]/25 transform hover:scale-105 flex items-center gap-3 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary)]/10 hover:from-[var(--accent-primary)] hover:to-[var(--accent-primary)]"
            onClick={onClose}
          >
            Get Started
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          
          <p className="text-sm text-[var(--text-secondary)] opacity-70 text-center">
            Join thousands of students improving their productivity
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
