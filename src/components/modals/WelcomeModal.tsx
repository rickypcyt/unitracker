import { BarChart2, Calendar, CheckCircle2, Clock, Music } from "lucide-react";

import BaseModal from "../common/BaseModal";
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
      title="Welcome to UniTracker"
      maxWidth="max-w-4xl"
      zIndex="z-[99999]"
      showCloseButton={false}
    >
      <div className="p-6 sm:p-8">
        <div className="flex-1 mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-accent-primary mb-2">
            Welcome to UniTracker
          </h3>
          <p className="text-text-secondary text-base sm:text-lg">
            Your all-in-one study companion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-neutral-800/50 p-6 rounded-xl hover:bg-neutral-800/70 transition-all duration-200 animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent-primary/20 rounded-lg text-accent-primary">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-800/50 p-6 rounded-xl mb-8">
          <h4 className="text-xl font-semibold text-accent-primary mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Getting Started
          </h4>
          <div className="space-y-4">
            <p className="text-text-secondary">
              UniTracker helps you manage your study time effectively. Here's what you can do:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                Create and organize your study tasks
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                Track your study sessions with the built-in timer
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                Use the Pomodoro technique for focused study sessions
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                Monitor your progress with detailed statistics
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default WelcomeModal;
