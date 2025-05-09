import React from "react";

interface StartSessionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  setIsPlaying: (playing: boolean) => void;
}

const StartSessionMenu: React.FC<StartSessionMenuProps> = ({
  isOpen,
  onClose,
  setIsPlaying,
}) => {
  if (!isOpen) return null;

  const handleStart = () => {
    setIsPlaying(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-neutral-800 p-6 rounded-lg text-text-primary max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Start New Session</h2>
        <p className="mb-4">Ready to start your study/work session?</p>
        <button
          onClick={handleStart}
          className="bg-accent-primary px-4 py-2 rounded text-white mr-2"
        >
          Start
        </button>
        <button
          onClick={onClose}
          className="bg-gray-600 px-4 py-2 rounded text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StartSessionMenu;
