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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md overflow-y-auto" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
      <div
        ref={modalRef}
        className={`bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl border-2 border-[var(--border-primary)]/50 w-full max-w-4xl relative shadow-2xl overflow-hidden transition-all duration-700 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] overflow-y-auto`}
        style={{ margin: 'clamp(0.25rem, 0.2rem + 0.3vw, 1rem)', padding: 'clamp(0.75rem, 0.6rem + 1vw, 2.5rem)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-primary)]/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute rounded-full bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 group active:scale-95"
          style={{ top: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)', right: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)', padding: 'clamp(0.375rem, 0.3rem + 0.4vw, 0.75rem)' }}
        >
          <X className="transition-transform duration-200" style={{ width: 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)', height: 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)' }} />
        </button>
        
        {/* Header Section */}
        <div className="flex flex-col items-center relative z-10" style={{ marginBottom: 'clamp(1rem, 0.8rem + 1vw, 2.5rem)' }}>
          {/* Logo with animation */}
          <div className="flex items-center justify-center" style={{ marginBottom: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)' }}>
            <span className="text-[var(--text-primary)] font-bold" style={{ fontSize: 'clamp(1.25rem, 1rem + 1.5vw, 3rem)' }}>Uni</span>
            <span className="text-[var(--accent-primary)] font-bold" style={{ fontSize: 'clamp(1.25rem, 1rem + 1.5vw, 3rem)' }}>Tracker</span>
          </div>
          
          <h2 className="font-semibold text-[var(--text-primary)] text-center bg-gradient-to-r from-[var(--text-primary)] to-[var(--accent-primary)] bg-clip-text text-transparent" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.6vw, 1.5rem)', marginBottom: 'clamp(0.375rem, 0.3rem + 0.3vw, 0.75rem)', paddingLeft: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)', paddingRight: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)' }}>
            Your all-in-one study companion
          </h2>
          
          <p className="text-[var(--text-secondary)] text-center max-w-2xl leading-relaxed" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.3vw, 1.125rem)', paddingLeft: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)', paddingRight: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)' }}>
            Organize your time, boost your productivity, and track your academic progress with a beautiful, modern, and intuitive app.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 relative z-10" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)', marginBottom: 'clamp(1rem, 0.8rem + 1vw, 2rem)' }}>
          <div className="flex items-start rounded-lg sm:rounded-xl bg-[var(--bg-secondary)]/30 border-2 border-[var(--border-primary)]/30" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)', padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)' }}>
            <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}>
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center" style={{ width: 'clamp(2rem, 1.8rem + 0.8vw, 3rem)', height: 'clamp(2rem, 1.8rem + 0.8vw, 3rem)' }}>
                <Clock className="text-[var(--accent-primary)]" style={{ width: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)', height: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)' }} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.3vw, 1.125rem)', marginBottom: 'clamp(0.125rem, 0.1rem + 0.1vw, 0.25rem)' }}>AI Task Creation</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.875rem)' }}>Quickly create tasks with AI assistance. Let our intelligent system help you organize your study sessions efficiently.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-start rounded-lg sm:rounded-xl bg-[var(--bg-secondary)]/30 border-2 border-[var(--border-primary)]/30" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)', padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)' }}>
            <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}>
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center" style={{ width: 'clamp(2rem, 1.8rem + 0.8vw, 3rem)', height: 'clamp(2rem, 1.8rem + 0.8vw, 3rem)' }}>
                <BarChart2 className="text-[var(--accent-primary)]" style={{ width: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)', height: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[var(--text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.3vw, 1.125rem)', marginBottom: 'clamp(0.125rem, 0.1rem + 0.1vw, 0.25rem)' }}>Weekly & Monthly Stats</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.875rem)' }}>Track your progress and productivity with comprehensive analytics and beautiful visualizations.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-start rounded-lg sm:rounded-xl bg-[var(--bg-secondary)]/30 border-2 border-[var(--border-primary)]/30" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)', padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)' }}>
            <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}>
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center" style={{ width: 'clamp(2rem, 1.8rem + 0.8vw, 3rem)', height: 'clamp(2rem, 1.8rem + 0.8vw, 3rem)' }}>
                <Calendar className="text-[var(--accent-primary)]" style={{ width: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)', height: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)' }} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.3vw, 1.125rem)', marginBottom: 'clamp(0.125rem, 0.1rem + 0.1vw, 0.25rem)' }}>Calendar Planning</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.875rem)' }}>Plan sessions and deadlines visually with our intuitive calendar system.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-start rounded-lg sm:rounded-xl bg-[var(--bg-secondary)]/30 border-2 border-[var(--border-primary)]/30" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)', padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)' }}>
            <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}>
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center" style={{ width: 'clamp(2rem, 1.8rem + 0.8vw, 3rem)', height: 'clamp(2rem, 1.8rem + 0.8vw, 3rem)' }}>
                <CheckCircle2 className="text-[var(--accent-primary)]" style={{ width: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)', height: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)' }} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.3vw, 1.125rem)', marginBottom: 'clamp(0.125rem, 0.1rem + 0.1vw, 0.25rem)' }}>Advanced Task System</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.875rem)' }}>Organize with kanban board system and manage your workflow efficiently.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="flex flex-col items-center relative z-10" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)' }}>
          <button
            className="group rounded-xl sm:rounded-2xl border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold cursor-pointer transition-all duration-300 transform active:scale-[0.98] flex items-center bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary)]/10"
            style={{ paddingLeft: 'clamp(1rem, 0.8rem + 1vw, 3rem)', paddingRight: 'clamp(1rem, 0.8rem + 1vw, 3rem)', paddingTop: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.25rem)', paddingBottom: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.25rem)', fontSize: 'clamp(0.75rem, 0.7rem + 0.3vw, 1.125rem)', gap: 'clamp(0.375rem, 0.3rem + 0.3vw, 0.75rem)', minHeight: 'clamp(2.75rem, 2.5rem + 0.5vw, 3rem)' }}
            onClick={onClose}
          >
            Get Started
            <ArrowRight className="transition-transform duration-300" style={{ width: 'clamp(1rem, 0.9rem + 0.3vw, 1.25rem)', height: 'clamp(1rem, 0.9rem + 0.3vw, 1.25rem)' }} />
          </button>
          
          <p className="text-[var(--text-secondary)] opacity-70 text-center" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.875rem)', paddingLeft: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)', paddingRight: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)' }}>
            Join thousands of students improving their productivity
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
