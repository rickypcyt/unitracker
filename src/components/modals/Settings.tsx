import React, { useState } from "react";
import { X, Bell, Eye, Globe, Info } from "lucide-react";
import AboutModal from "./AboutModal";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState({
    sessionReminders: true,
    taskDueDates: true,
    achievements: true
  });
  const [displayPreferences, setDisplayPreferences] = useState({
    compactMode: false,
    showAnimations: true
  });
  const [language, setLanguage] = useState('en');
  const [showAbout, setShowAbout] = useState(false);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleDisplayPreference = (key: keyof typeof displayPreferences) => {
    setDisplayPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
        onClick={handleOverlayClick}
      >
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 w-full max-w-md mx-4 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-100">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Notifications Section */}
            <div className="bg-neutral-800/50 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-neutral-100 flex items-center gap-2">
                <Bell size={18} />
                Notifications
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-neutral-300">Session Reminders</span>
                  <button
                    onClick={() => toggleNotification('sessionReminders')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notifications.sessionReminders ? 'bg-blue-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                        notifications.sessionReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-neutral-300">Task Due Dates</span>
                  <button
                    onClick={() => toggleNotification('taskDueDates')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notifications.taskDueDates ? 'bg-blue-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                        notifications.taskDueDates ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-neutral-300">Achievements</span>
                  <button
                    onClick={() => toggleNotification('achievements')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notifications.achievements ? 'bg-blue-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                        notifications.achievements ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Display Preferences Section */}
            <div className="bg-neutral-800/50 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-neutral-100 flex items-center gap-2">
                <Eye size={18} />
                Display Preferences
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-neutral-300">Compact Mode</span>
                  <button
                    onClick={() => toggleDisplayPreference('compactMode')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      displayPreferences.compactMode ? 'bg-blue-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                        displayPreferences.compactMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-neutral-300">Show Animations</span>
                  <button
                    onClick={() => toggleDisplayPreference('showAnimations')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      displayPreferences.showAnimations ? 'bg-blue-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                        displayPreferences.showAnimations ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Language Section */}
            <div className="bg-neutral-800/50 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-neutral-100 flex items-center gap-2">
                <Globe size={18} />
                Language
              </h3>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-neutral-700 text-neutral-300 border border-neutral-600 focus:outline-none focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            {/* About Section */}
            <div className="bg-neutral-800/50 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-neutral-100 flex items-center gap-2">
                <Info size={18} />
                About
              </h3>
              <button
                onClick={() => setShowAbout(true)}
                className="w-full px-4 py-2 rounded-lg bg-neutral-700 text-neutral-300 border border-neutral-600 hover:bg-neutral-600 transition-colors"
              >
                View About
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAbout && (
        <AboutModal
          isOpen={showAbout}
          onClose={() => setShowAbout(false)}
        />
      )}
    </>
  );
};

export default Settings;
