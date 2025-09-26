import { BarChart2, Calendar, CheckCircle2, Clock } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

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
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] w-full max-w-3xl mx-2 sm:mx-4 p-2 sm:p-3 md:px-8 md:py-3 relative shadow-2xl animate-fadeIn max-h-[85vh] sm:max-h-[80vh] overflow-y-auto"
      >
        <div className="flex flex-col items-center mb-3 sm:mb-4">
          <h1 className="flex items-center justify-center gap-1 mb-2 text-center">
            <span className="text-[var(--text-primary)] font-bold text-xl sm:text-2xl md:text-2xl">Uni</span>
            <span className="text-[var(--accent-primary)] font-bold text-xl sm:text-2xl md:text-2xl">Tracker</span>
          </h1>
          <p className="text-sm sm:text-base md:text-base text-[var(--text-secondary)] font-medium mb-1 text-center">Your all-in-one study companion</p>
          <p className="text-sm sm:text-sm md:text-sm text-[var(--text-secondary)] max-w-sm sm:max-w-xl text-center">Organize your time, boost your productivity, and track your academic progress with a beautiful, modern, and intuitive app.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex flex-col items-center bg-[var(--bg-secondary)] rounded-xl p-2 sm:p-4 border-2 border-[var(--border-primary)] shadow-sm">
            <Clock className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--accent-primary)] mb-1" />
            <span className="font-bold text-sm sm:text-base mb-1 text-[var(--text-primary)] text-center">AI Task Creation</span>
            <span className="text-[var(--text-secondary)] text-center text-sm sm:text-sm">Quickly create tasks with AI assistance.</span>
          </div>
          <div className="flex flex-col items-center bg-[var(--bg-secondary)] rounded-xl p-2 sm:p-4 border-2 border-[var(--border-primary)] shadow-sm">
            <BarChart2 className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--accent-primary)] mb-1" />
            <span className="font-bold text-sm sm:text-base mb-1 text-[var(--text-primary)] text-center">Weekly & Monthly Stats</span>
            <span className="text-[var(--text-secondary)] text-center text-sm sm:text-sm">Track your progress and productivity.</span>
          </div>
          <div className="flex flex-col items-center bg-[var(--bg-secondary)] rounded-xl p-2 sm:p-4 border-2 border-[var(--border-primary)] shadow-sm">
            <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--accent-primary)] mb-1" />
            <span className="font-bold text-sm sm:text-base mb-1 text-[var(--text-primary)] text-center">Calendar Planning</span>
            <span className="text-[var(--text-secondary)] text-center text-sm sm:text-sm">Plan sessions and deadlines visually.</span>
          </div>
          <div className="flex flex-col items-center bg-[var(--bg-secondary)] rounded-xl p-2 sm:p-4 border-2 border-[var(--border-primary)] shadow-sm">
            <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--accent-primary)] mb-1" />
            <span className="font-bold text-sm sm:text-base mb-1 text-[var(--text-primary)] text-center">Advanced Task System</span>
            <span className="text-[var(--text-secondary)] text-center text-sm sm:text-sm">Organize with kanban board system.</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-1 sm:mt-2 w-full mb-2 sm:mb-3">
          <button
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[var(--accent-primary)] text-white font-bold text-sm sm:text-base cursor-pointer transition-all duration-200 hover:bg-[var(--accent-primary-hover)] shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={onClose}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
