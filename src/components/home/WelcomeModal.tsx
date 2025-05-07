import React from "react";
import { X } from "lucide-react";

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  React.useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="maincard max-w-4xl w-full mx-4 p-6 rounded-lg text-text-primary">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-center flex-1 text-accent-primary">
            Welcome to UniTracker
          </h3>
          <button
            className="text-gray-400 hover:text-white transition duration-200"
            onClick={onClose}
            aria-label="Close welcome modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-lg text-center">
            This is a time management tool for those who like to study and work
            and have a record of how many hours they spend doing it.
          </p>

          <div>
            <h4 className="text-lg font-semibold text-accent-primary">
              Key Features:
            </h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Task Management: Create, track, and organize your study tasks
              </li>
              <li>
                Study Timer: Track your study sessions with a built-in timer
              </li>
              <li>
                Pomodoro Technique: Built-in Pomodoro timer for focused study
                sessions
              </li>
              <li>
                Progress Tracking: Visualize your study progress and statistics
              </li>
              <li>Calendar Integration: Plan and view your study schedule</li>
              <li>Noise Generator: Background sounds to help you focus</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-accent-primary">
              Data Storage:
            </h4>
            <p>
              All your data is securely stored in a database, ensuring your
              progress and tasks are always saved and accessible across devices.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-accent-primary">
              Built with:
            </h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>React for the frontend</li>
              <li>Tailwind CSS for styling</li>
              <li>Chakra UI for components</li>
              <li>Supabase for database and authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
