import { Bell, BellOff, Play, Target, Volume, Volume2, Zap } from 'lucide-react';
import { useAppStore, usePomodoroModes, usePomodoroSettings } from '@/store/appStore';
import { useEffect, useState } from 'react';

import BaseModal from '@/modals/BaseModal';
import { FormInput } from '@/modals/FormElements';
import type { PomodoroMode } from '@/store/appStore';
import React from 'react';
import { X } from 'lucide-react';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModeIndex: number;
  onModeChange: (index: number) => void;
  onSaveCustomMode: (mode: PomodoroMode) => void;
}

const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({ isOpen, onClose, currentModeIndex, onModeChange, onSaveCustomMode }) => {
  const pomodoroModes = usePomodoroModes();
  const pomodoroSettings = usePomodoroSettings();
  const updatePomodoroSettings = useAppStore((state) => state.updatePomodoroSettings);
  
  const [selectedModeIndex, setSelectedModeIndex] = useState(currentModeIndex);
  const [customWorkTime, setCustomWorkTime] = useState('');
  const [customBreakTime, setCustomBreakTime] = useState('');
  const [customLongBreakTime, setCustomLongBreakTime] = useState('');
  const [isCustomModeSelected, setIsCustomModeSelected] = useState(false);
  const [activeTab, setActiveTab] = useState<'modes' | 'settings' | 'sounds'>('modes');

  const testAlarm = () => {
    if (pomodoroSettings.soundEnabled) {
      const audio = new Audio('/sounds/break-end.mp3');
      audio.volume = pomodoroSettings.volume;
      audio.play().catch(err => console.log('Error playing test sound:', err));
    }
  };

  // Assume Custom mode is always the last one
  const customModeIndex = pomodoroModes.length - 1;

  useEffect(() => {
    if (isOpen) {
      console.log('🔧 DEBUG: Modal isOpen - initializing values');
      console.log('🔧 DEBUG: Modal - currentModeIndex:', currentModeIndex);
      console.log('🔧 DEBUG: Modal - customModeIndex:', customModeIndex);
      console.log('🔧 DEBUG: Modal - pomodoroModes:', pomodoroModes);
      
      setSelectedModeIndex(currentModeIndex);
      
      // Always load custom mode values if they exist, regardless of current mode
      const customMode = pomodoroModes[customModeIndex];
      console.log('🔧 DEBUG: Modal - customMode found:', customMode);
      
      if (customMode) {
        console.log('🔧 DEBUG: Modal - Loading saved custom values');
        setCustomWorkTime((customMode.work / 60).toString());
        setCustomBreakTime((customMode.break / 60).toString());
        setCustomLongBreakTime((customMode.longBreak / 60).toString());
        console.log('🔧 DEBUG: Modal - Set custom times to:', {
          work: customMode.work / 60,
          break: customMode.break / 60,
          longBreak: customMode.longBreak / 60
        });
      } else {
        console.log('🔧 DEBUG: Modal - No custom mode found, clearing values');
        setCustomWorkTime('');
        setCustomBreakTime('');
        setCustomLongBreakTime('');
      }
      
      // Check if current mode is custom (last mode)
      const isCustom = currentModeIndex === customModeIndex;
      setIsCustomModeSelected(isCustom);
      console.log('🔧 DEBUG: Modal - isCustomModeSelected:', isCustom);
    }
  }, [isOpen, currentModeIndex, pomodoroModes, customModeIndex]);

  const handleModeSelect = (index: number) => {
    setSelectedModeIndex(index);
    const isCustom = index === customModeIndex;
    setIsCustomModeSelected(isCustom);
    
    if (isCustom) {
      // Load current custom mode times when selecting custom mode
      const currentMode = pomodoroModes[customModeIndex];
      if (currentMode) {
        setCustomWorkTime((currentMode.work / 60).toString());
        setCustomBreakTime((currentMode.break / 60).toString());
        setCustomLongBreakTime((currentMode.longBreak / 60).toString());
      }
    }
  };

  const handleSave = () => {
    console.log('🔧 DEBUG: Modal - handleSave called');
    console.log('🔧 DEBUG: Modal - isCustomModeSelected:', isCustomModeSelected);
    console.log('🔧 DEBUG: Modal - customWorkTime:', customWorkTime);
    console.log('🔧 DEBUG: Modal - customBreakTime:', customBreakTime);
    console.log('🔧 DEBUG: Modal - customLongBreakTime:', customLongBreakTime);
    console.log('🔧 DEBUG: Modal - selectedModeIndex:', selectedModeIndex);
    console.log('🔧 DEBUG: Modal - customModeIndex:', customModeIndex);
    
    if (isCustomModeSelected) {
      // Custom mode selected - validate and save custom values
      const workTimeSeconds = customWorkTime ? parseInt(customWorkTime) * 60 : 1500; // Default to 25 min if empty
      const breakTimeSeconds = customBreakTime ? parseInt(customBreakTime) * 60 : 300; // Default to 5 min if empty
      const longBreakTimeSeconds = customLongBreakTime ? parseInt(customLongBreakTime) * 60 : 900; // Default to 15 min if empty
      
      console.log('🔧 DEBUG: Modal - Saving custom mode with times:', {
        work: workTimeSeconds / 60,
        break: breakTimeSeconds / 60,
        longBreak: longBreakTimeSeconds / 60
      });
      
      if (!isNaN(workTimeSeconds) && !isNaN(breakTimeSeconds) && !isNaN(longBreakTimeSeconds) && 
          workTimeSeconds > 0 && breakTimeSeconds > 0 && longBreakTimeSeconds > 0) {
        console.log('🔧 DEBUG: Modal - About to call onSaveCustomMode');
        onSaveCustomMode({ 
          label: 'Custom', 
          work: workTimeSeconds, 
          break: breakTimeSeconds,
          longBreak: longBreakTimeSeconds 
        });
        console.log('🔧 DEBUG: Modal - Called onSaveCustomMode');
      } else {
        alert('Please enter valid positive numbers for all time values.');
        return;
      }
    } else {
      // Predefined mode selected - just switch to it
      console.log('🔧 DEBUG: Modal - Switching to predefined mode:', selectedModeIndex);
      onModeChange(selectedModeIndex);
    }
    
    onClose();
  };

  const handleSettingsChange = (key: keyof typeof pomodoroSettings, value: any) => {
    updatePomodoroSettings({ [key]: value });
  };

  // Get predefined modes (excluding custom)
  const predefinedModes = pomodoroModes.slice(0, customModeIndex);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="" showHeader={false} className="!p-0">
      <div className="p-6 max-h-[80vh] overflow-y-auto">
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('modes')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
              activeTab === 'modes'
                ? 'border-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Zap size={16} />
            Modes
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
              activeTab === 'settings'
                ? 'border-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Play size={16} />
            Behavior
          </button>
          <button
            onClick={() => setActiveTab('sounds')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
              activeTab === 'sounds'
                ? 'border-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Volume2 size={16} />
            Sounds
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'modes' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Select Mode</h3>
              <div className="space-y-3">
                {predefinedModes.map((mode, index) => (
                  <div
                    key={mode.label}
                    onClick={() => handleModeSelect(index)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedModeIndex === index && !isCustomModeSelected
                        ? 'border-[var(--accent-primary)]'
                        : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)]">{mode.label}</h4>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{mode.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                          <span>Work: {mode.work / 60}min</span>
                          <span>Break: {mode.break / 60}min</span>
                          <span>Long: {mode.longBreak / 60}min</span>
                        </div>
                      </div>
                      {selectedModeIndex === index && !isCustomModeSelected && (
                        <div className="w-4 h-4 rounded-full bg-[var(--accent-primary)]"></div>
                      )}
                    </div>
                  </div>
                ))}
                <div
                  onClick={() => handleModeSelect(customModeIndex)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isCustomModeSelected
                      ? 'border-[var(--accent-primary)]'
                      : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)]">Custom</h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">Your personalized settings</p>
                    </div>
                    {isCustomModeSelected && (
                      <div className="w-4 h-4 rounded-full bg-[var(--accent-primary)]"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isCustomModeSelected && (
              <div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Custom Times</h3>
                <div className="grid grid-cols-3 gap-4">
                  <FormInput
                    id="customWork"
                    label="Work (min)"
                    type="number"
                    min="1"
                    max="120"
                    value={customWorkTime}
                    onChange={(value: string) => setCustomWorkTime(value)}
                    placeholder="25"
                    error=""
                  />
                  <FormInput
                    id="customBreak"
                    label="Break (min)"
                    type="number"
                    min="1"
                    max="30"
                    value={customBreakTime}
                    onChange={(value: string) => setCustomBreakTime(value)}
                    placeholder="5"
                    error=""
                  />
                  <FormInput
                    id="customLongBreak"
                    label="Long Break (min)"
                    type="number"
                    min="1"
                    max="60"
                    value={customLongBreakTime}
                    onChange={(value: string) => setCustomLongBreakTime(value)}
                    placeholder="15"
                    error=""
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Auto-start Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg">
                  <span className="text-[var(--text-primary)]">Auto-start breaks</span>
                  <input
                    type="checkbox"
                    checked={pomodoroSettings.autoStartBreak}
                    onChange={(e) => handleSettingsChange('autoStartBreak', e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--accent-primary)]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg">
                  <span className="text-[var(--text-primary)]">Auto-start work sessions</span>
                  <input
                    type="checkbox"
                    checked={pomodoroSettings.autoStartWork}
                    onChange={(e) => handleSettingsChange('autoStartWork', e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--accent-primary)]"
                  />
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Daily Goals</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg">
                  <Target size={20} className="text-[var(--accent-primary)]" />
                  <div className="flex-1">
                    <label className="text-[var(--text-primary)]">Daily Pomodoro Goal</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={pomodoroSettings.dailyGoal}
                      onChange={(e) => handleSettingsChange('dailyGoal', parseInt(e.target.value) || 1)}
                      className="mt-1 w-20 px-2 py-1 rounded text-[var(--text-primary)] border border-[var(--border-primary)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sounds' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Sound Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-[var(--accent-primary)]" />
                    <span className="text-[var(--text-primary)]">Timer sounds</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pomodoroSettings.soundEnabled}
                    onChange={(e) => handleSettingsChange('soundEnabled', e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--accent-primary)]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BellOff size={20} className="text-[var(--accent-primary)]" />
                    <span className="text-[var(--text-primary)]">Browser notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pomodoroSettings.notificationEnabled}
                    onChange={(e) => handleSettingsChange('notificationEnabled', e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--accent-primary)]"
                  />
                </label>
                              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Volume</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg">
                <Volume2 size={20} className="text-[var(--accent-primary)]" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={pomodoroSettings.volume}
                  onChange={(e) => handleSettingsChange('volume', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[var(--text-primary)] w-12 text-right">
                  {Math.round(pomodoroSettings.volume * 100)}%
                </span>
              </div>
              
              <div className="mt-3">
                <button
                  onClick={testAlarm}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                >
                  <Volume size={16} />
                  Test Alarm Sound
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
          >
            {isCustomModeSelected ? 'Save Custom Mode' : `Select ${predefinedModes[selectedModeIndex]?.label || 'Mode'}`}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PomodoroSettingsModal; 