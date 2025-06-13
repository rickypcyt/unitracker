import React, { useEffect, useState } from 'react';

import BaseModal from '../common/BaseModal';
import { FormInput } from '../common/FormElements';

const PomodoroSettingsModal = ({ isOpen, onClose, currentModeIndex, modes, onModeChange, onSaveCustomMode }) => {
  const [selectedModeIndex, setSelectedModeIndex] = useState(currentModeIndex);
  const [customWorkTime, setCustomWorkTime] = useState('');
  const [customBreakTime, setCustomBreakTime] = useState('');
  const [customLongBreakTime, setCustomLongBreakTime] = useState('');
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
        setCustomLongBreakTime((modes[currentModeIndex].longBreak / 60).toString());
      } else {
        setCustomWorkTime('');
        setCustomBreakTime('');
        setCustomLongBreakTime('');
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
      const longBreakTimeSeconds = parseInt(customLongBreakTime) * 60;
      if (!isNaN(workTimeSeconds) && !isNaN(breakTimeSeconds) && !isNaN(longBreakTimeSeconds) && 
          workTimeSeconds > 0 && breakTimeSeconds > 0 && longBreakTimeSeconds > 0) {
        onSaveCustomMode({ 
          label: 'Custom', 
          work: workTimeSeconds, 
          break: breakTimeSeconds,
          longBreak: longBreakTimeSeconds 
        });
        onClose();
      } else {
        // Handle invalid input
        alert('Please enter valid positive numbers for all time values.');
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
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Select Mode</h3>
          <div className="flex gap-2 flex-wrap">
            {predefinedModes.map((mode, index) => (
              <button
                key={mode.label}
                onClick={() => handleModeSelect(index)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedModeIndex === index && !isCustomModeSelected
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)]'
                }`}
              >
                {mode.label}
              </button>
            ))}
            <button
              onClick={() => handleModeSelect(customModeIndex)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isCustomModeSelected
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)]'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {isCustomModeSelected && modes[customModeIndex] && (
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Custom Mode (minutes)</h3>
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                id="customWork"
                label="Work Time"
                type="number"
                min="1"
                value={customWorkTime}
                onChange={(value) => setCustomWorkTime(value)}
                placeholder="Enter work time"
              />
              <FormInput
                id="customBreak"
                label="Break Time"
                type="number"
                min="1"
                value={customBreakTime}
                onChange={(value) => setCustomBreakTime(value)}
                placeholder="Enter break time"
              />
              <FormInput
                id="customLongBreak"
                label="Long Break Time"
                type="number"
                min="1"
                value={customLongBreakTime}
                onChange={(value) => setCustomLongBreakTime(value)}
                placeholder="Enter long break time"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/80 transition-colors"
          >
            {isCustomModeSelected ? 'Save Custom Mode' : 'Select Mode'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PomodoroSettingsModal; 