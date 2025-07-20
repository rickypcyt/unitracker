import { BarChart2, Calendar, CheckCircle2, Clock, Music } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface WelcomeModalProps {
  onClose: () => void;
  onStartTour?: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onStartTour }) => {
  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Study Timer",
      description: "Track your study sessions with a built-in timer and Pomodoro technique"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Task Management",
      description: "Create, organize, and track your study tasks efficiently"
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: "Progress Tracking",
      description: "Visualize your study progress and statistics with detailed analytics"
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: "Focus Sounds",
      description: "Enhance your focus with customizable background sounds"
    }
  ];

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] w-full max-w-3xl mx-2 sm:mx-4 p-2 sm:p-6 md:p-10 relative shadow-2xl animate-fadeIn max-h-screen overflow-y-auto"
      >
        <button
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >×</button>
        <div className="flex flex-col items-center mb-6">
          <h1 className="flex items-center justify-center gap-1 mb-2 text-center">
            <span className="text-[var(--text-primary)] font-bold text-2xl sm:text-3xl md:text-4xl">Uni</span>
            <span className="text-[var(--accent-primary)] font-bold text-2xl sm:text-3xl md:text-4xl">Tracker</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] font-medium mb-2 text-center">Your all-in-one study companion</p>
          <p className="text-sm sm:text-base md:text-base text-[var(--text-secondary)] max-w-xs sm:max-w-xl text-center">Organize your time, boost your productivity, and track your academic progress with a beautiful, modern, and intuitive app.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="flex flex-col items-center bg-[var(--bg-secondary)] rounded-xl p-5 border-2 border-[var(--border-primary)] shadow-sm">
            <Clock className="w-8 h-8 text-[var(--accent-primary)] mb-2" />
            <span className="font-bold text-base sm:text-lg mb-1 text-[var(--text-primary)] text-center">AI Task Creation</span>
            <span className="text-[var(--text-secondary)] text-center text-sm sm:text-base">Quickly create tasks with the help of AI. Let the assistant generate, organize, and describe your study tasks for you.</span>
          </div>
          <div className="flex flex-col items-center bg-[var(--bg-secondary)] rounded-xl p-5 border-2 border-[var(--border-primary)] shadow-sm">
            <BarChart2 className="w-8 h-8 text-[var(--accent-primary)] mb-2" />
            <span className="font-bold text-base sm:text-lg mb-1 text-[var(--text-primary)] text-center">Weekly & Monthly Stats</span>
            <span className="text-[var(--text-secondary)] text-center text-sm sm:text-base">See your progress for last week, this week, and the current month. Track your productivity and streaks over time.</span>
          </div>
          <div className="flex flex-col items-center bg-[var(--bg-secondary)] rounded-xl p-5 border-2 border-[var(--border-primary)] shadow-sm">
            <Calendar className="w-8 h-8 text-[var(--accent-primary)] mb-2" />
            <span className="font-bold text-base sm:text-lg mb-1 text-[var(--text-primary)] text-center">Calendar Planning</span>
            <span className="text-[var(--text-secondary)] text-center text-sm sm:text-base">Plan your study sessions and deadlines visually with the integrated calendar. Never miss an important date.</span>
          </div>
          <div className="flex flex-col items-center bg-[var(--bg-secondary)] rounded-xl p-5 border-2 border-[var(--border-primary)] shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-[var(--accent-primary)] mb-2" />
            <span className="font-bold text-base sm:text-lg mb-1 text-[var(--text-primary)] text-center">Advanced Task System</span>
            <span className="text-[var(--text-secondary)] text-center text-sm sm:text-base">Organize, prioritize, and track your tasks with a powerful kanban board and assignment system.</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2 w-full">
          <button
            className="w-full sm:w-auto px-6 py-3 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold text-base sm:text-lg bg-transparent cursor-pointer"
            onClick={onClose}
          >
            Start using UniTracker
          </button>
          <button
            className="w-full sm:w-auto px-6 py-3 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold text-base sm:text-lg bg-transparent cursor-pointer"
            onClick={() => onStartTour && onStartTour()}
          >
            Take a Guided Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
