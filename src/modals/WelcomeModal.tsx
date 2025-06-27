import { BarChart2, Calendar, CheckCircle2, Clock, Music } from "lucide-react";

import BaseModal from "@/modals/BaseModal";
import React from "react";

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
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

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title=""
      maxWidth="max-w-3xl"
      zIndex="z-[99999]"
      showCloseButton={false}
    >
      <div className="">
        <div className="flex-1 mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-accent-primary mb-1">
            Welcome to UniTracker
          </h3>
          <p className="text-gray text-sm sm:text-base">
            Your all-in-one study companion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-[var(--bg-secondary)] p-4 rounded-xl hover:bg-[var(--bg-primary)] transition-all duration-200 animate-slideUp border-2 border-[var(--border-primary)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-accent-primary/20 rounded-lg text-accent-primary">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-neutral-500 mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl mb-4 border-2 border-[var(--border-primary)]">
          <h4 className="text-lg font-semibold text-accent-primary mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Getting Started
          </h4>
          <div className="space-y-2">
            <p className="text-sm text-gray">
              UniTracker helps you manage your study time effectively. Here's what you can do:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray">
                <div className="w-1 h-1 rounded-full bg-accent-primary" />
                Create and organize your study tasks
              </li>
              <li className="flex items-center gap-2 text-sm text-gray">
                <div className="w-1 h-1 rounded-full bg-accent-primary" />
                Track your study sessions with the built-in timer
              </li>
              <li className="flex items-center gap-2 text-sm text-gray">
                <div className="w-1 h-1 rounded-full bg-accent-primary" />
                Use the Pomodoro technique for focused study sessions
              </li>
              <li className="flex items-center gap-2 text-sm text-gray">
                <div className="w-1 h-1 rounded-full bg-accent-primary" />
                Monitor your progress with detailed statistics
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default WelcomeModal;
