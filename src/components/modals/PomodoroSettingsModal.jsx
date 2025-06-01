import React, { useEffect, useState } from 'react';

import BaseModal from '../common/BaseModal';
import { X } from 'lucide-react';

const PomodoroSettingsModal = ({ isOpen, onClose, currentModeIndex, modes, onModeChange, onSaveCustomMode }) => {
  const [selectedModeIndex, setSelectedModeIndex] = useState(currentModeIndex);
  const [customWorkTime, setCustomWorkTime] = useState('');
  const [customBreakTime, setCustomBreakTime] = useState('');
  const [isCustomModeSelected, setIsCustomModeSelected] = useState(false);

  // Assume Custom mode is always the last one
  const customModeIndex = modes.length - 1;

  useEffect(() => {
    if (isOpen) {
      setSelectedModeIndex(currentModeIndex);
      // Check if current mode is custom (last mode)
      const isCustom = currentModeIndex === customModeIndex;
      setIsCustomModeSelected(isCustom);
      if (isCustom) {
        // Load current custom mode times
        setCustomWorkTime((modes[currentModeIndex].work / 60).toString());
        setCustomBreakTime((modes[currentModeIndex].break / 60).toString());
      } else {
        setCustomWorkTime('');
        setCustomBreakTime('');
      }
    }
  }, [isOpen, currentModeIndex, modes, customModeIndex]);

  const handleModeSelect = (index) => {
    setSelectedModeIndex(index);
    // If selecting the last mode (Custom), show edit view
    setIsCustomModeSelected(index === customModeIndex);
  };

  const handleSave = () => {
    if (isCustomModeSelected) {
      const workTimeSeconds = parseInt(customWorkTime) * 60;
      const breakTimeSeconds = parseInt(customBreakTime) * 60;
      if (!isNaN(workTimeSeconds) && !isNaN(breakTimeSeconds) && workTimeSeconds > 0 && breakTimeSeconds > 0) {
        onSaveCustomMode({ label: 'Custom', work: workTimeSeconds, break: breakTimeSeconds });
        // After saving custom mode, keep it selected and show edit fields
        // onClose(); // Don't close after saving custom, let user confirm or select another mode
      } else {
        // Handle invalid input
        alert('Please enter valid positive numbers for custom work and break times.');
      }
    } else {
      onModeChange(selectedModeIndex);
      onClose();
    }
  };

  // Get predefined modes (excluding custom)
  const predefinedModes = modes.slice(0, customModeIndex);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Pomodoro Settings">
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-neutral-300 mb-2">Select Mode</h3>
          <div className="flex gap-2 flex-wrap">
            {predefinedModes.map((mode, index) => (
              <button
                key={mode.label}
                onClick={() => handleModeSelect(index)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedModeIndex === index && !isCustomModeSelected
                    ? 'bg-accent-primary text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
            <button
              onClick={() => handleModeSelect(customModeIndex)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                isCustomModeSelected
                  ? 'bg-accent-primary text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {isCustomModeSelected && modes[customModeIndex] && (
          <div className="mb-4">
            <h3 className="text-lg font-medium text-neutral-300 mb-2">Custom Mode (minutes)</h3>
            <div className="flex gap-4">
              <div>
                <label htmlFor="customWork" className="block text-sm font-medium text-neutral-400 mb-1">Work Time</label>
                <input
                  id="customWork"
                  type="number"
                  min="1"
                  value={customWorkTime}
                  onChange={(e) => setCustomWorkTime(e.target.value)}
                  className="w-24 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label htmlFor="customBreak" className="block text-sm font-medium text-neutral-400 mb-1">Break Time</label>
                <input
                  id="customBreak"
                  type="number"
                  min="1"
                  value={customBreakTime}
                  onChange={(e) => setCustomBreakTime(e.target.value)}
                  className="w-24 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            {'Select Mode'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PomodoroSettingsModal; 