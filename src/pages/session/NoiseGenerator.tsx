import { AudioLines, Cloud, CloudRain, MoreVertical, Pause, Play, SquareArrowOutUpRight, Waves, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import ReactSlider from "react-slider";
import SectionTitle from '@/components/SectionTitle';
import { motion } from "framer-motion";
import BaseModal from '@/modals/BaseModal';
import { useNoise } from '@/utils/NoiseContext';

// Componente de control para cada sonido
function SoundControl({ label, icon: Icon, volume, setVolume, isPlaying, start, stop, className, max }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden bg-gradient-to-br from-[var(--accent-secondary)/5] to-[var(--accent-primary)/5] p-4 rounded-xl border-[var(--border-primary)] hover:shadow-md transition-all duration-300 ${className || ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <label className="text-md font-medium text-[var(--text-primary)] flex items-center gap-2">
          <div className="p-1 bg-[var(--accent-primary)]/10 rounded-md">
            <Icon size={18} className="text-[var(--accent-primary)]" />
          </div>
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-normal bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full">
            {Math.round((volume / max) * 100)}%
          </span>
          <div className="w-8 flex justify-center">
            {!isPlaying ? (
              <button
                type="button"
                onClick={start}
                className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                <Play size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={stop}
                className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
              >
                <Pause size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="slider-container">
        <ReactSlider
          className="h-2 w-full"
          thumbClassName="w-4 h-4 rounded-full bg-[var(--accent-primary)] cursor-pointer hover:bg-[var(--accent-primary)]/80 transition-colors -translate-y-1 border-2 border-[var(--accent-primary)]"
          trackClassName="h-2 rounded-full bg-[var(--border-primary)]"
          renderTrack={(props, state) => {
            const { key, ...rest } = props;
            return (
              <div
                key={key}
                {...rest}
                className={`h-2 rounded-full ${state.index === 0 ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-primary)]'}`}
              />
            );
          }}
          min={0}
          max={max}
          step={0.01}
          value={volume}
          onChange={value => setVolume(value)}
          renderThumb={(props) => {
            const { key, ...rest } = props;
            return <div key={key} {...rest} />;
          }}
        />
      </div>
    </motion.div>
  );
}

function NoiseSettingsModal({ isOpen, onClose, sounds, setVolume, maxVolumes, setMaxVolumes }) {
  // Track selected preset per sound (default to 'Default')
  const [selectedPresets, setSelectedPresets] = useState([0, 0, 0]);

  // Presets for each sound type
  const brownPresets = [
    { label: 'Default', filterFreq: 200 },
    { label: 'Deep', filterFreq: 60 },
    { label: 'Balanced', filterFreq: 200 },
    { label: 'Bright', filterFreq: 400 }
  ];
  const rainPresets = [
    { label: 'Default', highpass: 200, lowpass: 1500, reverbWet: 0.2 },
    { label: 'Soft', highpass: 100, lowpass: 1000, reverbWet: 0.1 },
    { label: 'Medium', highpass: 200, lowpass: 1500, reverbWet: 0.2 },
    { label: 'Heavy', highpass: 300, lowpass: 2000, reverbWet: 0.4 }
  ];
  const oceanPresets = [
    { label: 'Default', pinkHigh: 200, pinkLow: 1200, reverbWet: 0.4, waveLfoFreq: 0.1 },
    { label: 'Calm', pinkHigh: 100, pinkLow: 800, reverbWet: 0.2, waveLfoFreq: 0.04 },
    { label: 'Waves', pinkHigh: 200, pinkLow: 1200, reverbWet: 0.4, waveLfoFreq: 0.1 },
    { label: 'Storm', pinkHigh: 400, pinkLow: 1800, reverbWet: 0.7, waveLfoFreq: 0.2 }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Noise Generator Settings"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        <SectionTitle 
          title="Customize your white noise environment for optimal focus. Mix different sounds like rain, waves, and ambient noise to create your perfect study atmosphere."
          size="sm"
        />
        {sounds.map((sound, idx) => {
          let presets = [];
          let onPreset = () => {};
          if (sound.key === 'brown') {
            presets = brownPresets;
            onPreset = (preset) => {
              if (sound.soundRef && sound.soundRef.filter) {
                sound.soundRef.filter.frequency.value = preset.filterFreq;
              }
            };
          } else if (sound.key === 'rain') {
            presets = rainPresets;
            onPreset = (preset) => {
              if (sound.soundRef) {
                if (sound.soundRef.highpass) sound.soundRef.highpass.frequency.value = preset.highpass;
                if (sound.soundRef.lowpass) sound.soundRef.lowpass.frequency.value = preset.lowpass;
                if (sound.soundRef.reverb) sound.soundRef.reverb.wet.value = preset.reverbWet;
              }
            };
          } else if (sound.key === 'ocean') {
            presets = oceanPresets;
            onPreset = (preset) => {
              if (sound.soundRef) {
                if (sound.soundRef.pinkHighpass) sound.soundRef.pinkHighpass.frequency.value = preset.pinkHigh;
                if (sound.soundRef.pinkLowpass) sound.soundRef.pinkLowpass.frequency.value = preset.pinkLow;
                if (sound.soundRef.reverb) sound.soundRef.reverb.wet.value = preset.reverbWet;
                if (sound.soundRef.waveLFO && preset.waveLfoFreq) sound.soundRef.waveLFO.frequency.value = preset.waveLfoFreq;
              }
            };
          }
          return (
            <div key={sound.key} className="mb-4 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2 mb-2">
                {sound.icon === "Cloud" ? <Cloud size={22} /> : sound.icon === "CloudRain" ? <CloudRain size={22} /> : <Waves size={22} />}
                <span className="font-semibold text-[var(--text-primary)]">{sound.label}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-[var(--text-secondary)]">Max Volume:</span>
                <input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={maxVolumes[idx]}
                  onChange={e => {
                    const value = parseFloat(e.target.value);
                    setMaxVolumes(vols => vols.map((v, i) => (i === idx ? value : v)));
                    if (sounds[idx].volume > value) setVolume(idx, value);
                  }}
                  className="w-16 px-2 py-1 rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-1">
                {presets.map((preset, pIdx) => (
                  <button
                    key={preset.label}
                    className={
                      `px-2 py-1 rounded border text-sm transition ` +
                      (selectedPresets[idx] === pIdx
                        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-white')
                    }
                    onClick={() => {
                      onPreset(preset);
                      setSelectedPresets(sel => sel.map((v, i) => i === idx ? pIdx : v));
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
}

// Componente principal
export default function NoiseGenerator() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { sounds, startSound, stopSound, setVolume, isInitialized, initializeAudio } = useNoise();
  
  // Default max volumes: 2 for brown, 4 for rain, 4 for ocean
  const [maxVolumes, setMaxVolumes] = useState(() => {
    const saved = localStorage.getItem('noiseMaxVolumes');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length === 3) return arr;
      } catch { /* ignore parse error */ }
    }
    return [2, 4, 4];
  });

  // Save maxVolumes to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('noiseMaxVolumes', JSON.stringify(maxVolumes));
  }, [maxVolumes]);
  
  const handleStart = async (index) => {
    if (!isInitialized) {
      await initializeAudio();
    }
    startSound(index);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pb-2 border-b border-[var(--border-primary)]"
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <div className="p-1.5 bg-[var(--accent-primary)]/10 rounded-lg">
            <AudioLines size={20} className="text-[var(--accent-primary)]" />
          </div>
          <span>Noise Generator</span>
        </h3>
        <button
          className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Noise generator settings"
        >
          <MoreVertical size={18} />
        </button>
      </motion.div>

      {/* Sound Controls */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {sounds.map((sound, idx) => (
          <motion.div key={sound.key} variants={item}>
            <SoundControl
              label={sound.label}
              icon={sound.icon === "Cloud" ? Cloud : sound.icon === "CloudRain" ? CloudRain : Waves}
              volume={sound.volume}
              setVolume={(volume) => setVolume(idx, volume)}
              isPlaying={sound.isPlaying}
              start={() => handleStart(idx)}
              stop={() => stopSound(idx)}
              className={sound.key === 'ocean' ? 'mb-2' : ''}
              max={maxVolumes[idx]}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* External Link */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full flex justify-center"
      >
        <button
          className="text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-2"
          onClick={() => window.open('https://music4study.vercel.app/', '_blank', 'noopener,noreferrer')}
          type="button"
        >
          More Sounds <SquareArrowOutUpRight size={16} />
        </button>
      </motion.div>

      <NoiseSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        sounds={sounds}
        setVolume={setVolume}
        maxVolumes={maxVolumes}
        setMaxVolumes={setMaxVolumes}
      />
    </div>
  );
}
