import { useEffect, useState } from 'react';

import BaseModal from '@/modals/BaseModal';
import { FormInput } from '@/modals/FormElements';
import React from 'react';
import { X } from 'lucide-react';

interface PomodoroMode {
  label: string;
  work: number;
  break: number;
  longBreak: number;
}

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModeIndex: number;
  modes: PomodoroMode[];
  onModeChange: (index: number) => void;
  onSaveCustomMode: (mode: PomodoroMode) => void;
  workSessionsBeforeLongBreak: number;
  onWorkSessionsChange: (value: number) => void;
  longBreakDuration: number;
  onLongBreakDurationChange: (value: number) => void;
}

const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({ isOpen, onClose, currentModeIndex, modes, onModeChange, onSaveCustomMode, workSessionsBeforeLongBreak, onWorkSessionsChange, longBreakDuration, onLongBreakDurationChange }) => {
  const [selectedModeIndex, setSelectedModeIndex] = useState(currentModeIndex);
  const [customWorkTime, setCustomWorkTime] = useState('');
  const [customBreakTime, setCustomBreakTime] = useState('');
  const [customLongBreakTime, setCustomLongBreakTime] = useState('');
  const [isCustomModeSelected, setIsCustomModeSelected] = useState(false);
  const [workSessions, setWorkSessions] = useState(workSessionsBeforeLongBreak);
  const [longBreakDur, setLongBreakDur] = useState(longBreakDuration);

  // Assume Custom mode is always the last one
  const customModeIndex = modes.length - 1;

  useEffect(() => {
    if (isOpen) {
      setSelectedModeIndex(currentModeIndex);
      setWorkSessions(workSessionsBeforeLongBreak);
      setLongBreakDur(longBreakDuration);
      // Check if current mode is custom (last mode)
      const isCustom = currentModeIndex === customModeIndex;
      setIsCustomModeSelected(isCustom);
      if (isCustom) {
        // Load current custom mode times
        const currentMode = modes[currentModeIndex];
        if (currentMode) {
          setCustomWorkTime((currentMode.work / 60).toString());
          setCustomBreakTime((currentMode.break / 60).toString());
          setCustomLongBreakTime((currentMode.longBreak / 60).toString());
        }
      } else {
        // Reset custom times when not in custom mode
        setCustomWorkTime('');
        setCustomBreakTime('');
        setCustomLongBreakTime('');
      }
    }
  }, [isOpen, currentModeIndex, modes, customModeIndex, workSessionsBeforeLongBreak, longBreakDuration]);

  const handleModeSelect = (index: number) => {
    setSelectedModeIndex(index);
    const isCustom = index === customModeIndex;
    setIsCustomModeSelected(isCustom);
    
    if (isCustom) {
      // Load current custom mode times when selecting custom mode
      const currentMode = modes[customModeIndex];
      if (currentMode) {
        setCustomWorkTime((currentMode.work / 60).toString());
        setCustomBreakTime((currentMode.break / 60).toString());
        setCustomLongBreakTime((currentMode.longBreak / 60).toString());
      }
    }
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
        onModeChange(customModeIndex); // Ensure we switch to custom mode after saving
      } else {
        // Handle invalid input
        alert('Please enter valid positive numbers for all time values.');
        return; // Don't close the modal if there's invalid input
      }
    } else {
      onModeChange(selectedModeIndex);
    }
    
    // Apply work sessions and long break duration, then close the modal
    onWorkSessionsChange(workSessions);
    onLongBreakDurationChange(longBreakDur);
    onClose();
  };

  // Get predefined modes (excluding custom)
  const predefinedModes = modes.slice(0, customModeIndex);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="" showHeader={false} className="!p-0">
      <div className="p-6 max-h-[66vh] overflow-y-auto">
        <div className="relative flex items-center justify-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] text-center">
            Pomodoro Settings
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Select Mode</h3>
          <div className="flex gap-2 flex-wrap">
            {predefinedModes.map((mode: PomodoroMode, index: number) => (
              <button
                key={mode.label}
                onClick={() => handleModeSelect(index)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedModeIndex === index && !isCustomModeSelected
                    ? 'px-4 border-2 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 undefined border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]'
                    : 'px-4 border-2 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 undefined border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)]'
                }`}
              >
                {mode.label}
              </button>
            ))}
            <button
              onClick={() => handleModeSelect(customModeIndex)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isCustomModeSelected
                  ? 'px-4 py-2 rounded-lg transition-colors px-4 border-2 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 undefined border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)]'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {isCustomModeSelected && modes[customModeIndex] && (
          <div>
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                id="customWork"
                label="Work Time"
                type="number"
                min="1"
                value={customWorkTime}
                onChange={(value: string) => setCustomWorkTime(value)}
                placeholder="Enter work time"
                error=""
              />
              <FormInput
                id="customBreak"
                label="Break Time"
                type="number"
                min="1"
                value={customBreakTime}
                onChange={(value: string) => setCustomBreakTime(value)}
                placeholder="Enter break time"
                error=""
              />
              <FormInput
                id="customLongBreak"
                label="Long Break Time"
                type="number"
                min="1"
                value={customLongBreakTime}
                onChange={(value: string) => setCustomLongBreakTime(value)}
                placeholder="Enter long break time"
                error=""
              />
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Work Sessions</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="workSessions"
              label="Sessions until Long Break"
              type="number"
              min="1"
              max="10"
              value={workSessions}
              onChange={(value: string) => setWorkSessions(parseInt(value))}
              placeholder="Enter number of work sessions"
              error=""
            />
            <FormInput
              id="longBreakDuration"
              label="Long Break Duration (minutes)"
              type="number"
              min="1"
              max="120"
              value={longBreakDur}
              onChange={(value: string) => setLongBreakDur(parseInt(value))}
              error=""
              placeholder="Enter long break duration"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="cancel-button border-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 border-2 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 undefined border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]"
          >
            {isCustomModeSelected ? 'Save Custom Mode' : 'Select Mode'}
          </button>
        </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default PomodoroSettingsModal; 