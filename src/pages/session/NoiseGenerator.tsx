import {
  Cloud,
  CloudRain,
  MoreVertical,
  Pause,
  Play,
  Waves,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import BaseModal from "@/modals/BaseModal";
import ReactSlider from "react-slider";
import { motion } from "framer-motion";
import { useNoise } from "@/utils/NoiseContext";

// -------------------------
// SoundControl component
// -------------------------

// Definir tipo para las props del icono
interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

type IconComponent = React.ComponentType<IconProps>;

interface SoundControlProps {
  label: string;
  icon: IconComponent;
  volume: number;
  setVolume: (vol: number) => void;
  isPlaying: boolean;
  start: () => void;
  stop: () => void;
  className?: string;
  max: number;
}

function SoundControl({
  label,
  icon: Icon,
  volume,
  setVolume,
  isPlaying,
  start,
  stop,
  className,
  max,
}: SoundControlProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden bg-gradient-to-br from-[var(--accent-secondary)/5] to-[var(--accent-primary)/5] p-4 rounded-xl border-[var(--border-primary)] hover:shadow-md transition-all duration-300 ${
        className || ""
      }`}
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
              className={`h-2 rounded-full ${
                state.index === 0
                  ? "bg-[var(--accent-primary)]"
                  : "bg-[var(--border-primary)]"
              }`}
            />
          );
        }}
        min={0}
        max={max}
        step={0.01}
        value={volume}
        onChange={setVolume}
        renderThumb={(props) => {
          const { key, ...rest } = props;
          return <div key={key} {...rest} />;
        }}
      />
    </motion.div>
  );
}

// -------------------------
// NoiseSettingsModal
// -------------------------
function NoiseSettingsModal({
  isOpen,
  onClose,
  sounds,
  setVolume,
  maxVolumes,
  setMaxVolumes,
}: {
  isOpen: boolean;
  onClose: () => void;
  sounds: ReturnType<typeof useNoise>["sounds"];
  setVolume: (index: number, volume: number) => void;
  maxVolumes: number[];
  setMaxVolumes: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const [selectedPresets, setSelectedPresets] = useState<[number, number, number]>([0, 0, 0]);

  // Tipos para los presets
  type BrownPreset = {
    label: string;
    filterFreq: number;
  };

  type RainPreset = {
    label: string;
    highpass: number;
    lowpass: number;
    reverbWet: number;
  };

  type OceanPreset = {
    label: string;
    pinkHigh: number;
    pinkLow: number;
    reverbWet: number;
    waveLfoFreq?: number;
  };

  type Preset = BrownPreset | RainPreset | OceanPreset;

  type PresetsMap = {
    brown: BrownPreset[];
    rain: RainPreset[];
    ocean: OceanPreset[];
  };

  const presetsMap: PresetsMap = {
    brown: [
      { label: "Default", filterFreq: 200 },
      { label: "Deep", filterFreq: 60 },
      { label: "Balanced", filterFreq: 200 },
      { label: "Bright", filterFreq: 400 },
    ],
    rain: [
      { label: "Default", highpass: 200, lowpass: 1500, reverbWet: 0.2 },
      { label: "Soft", highpass: 100, lowpass: 1000, reverbWet: 0.1 },
      { label: "Medium", highpass: 200, lowpass: 1500, reverbWet: 0.2 },
      { label: "Heavy", highpass: 300, lowpass: 2000, reverbWet: 0.4 },
    ],
    ocean: [
      {
        label: "Default",
        pinkHigh: 200,
        pinkLow: 1200,
        reverbWet: 0.4,
        waveLfoFreq: 0.1,
      },
      {
        label: "Calm",
        pinkHigh: 100,
        pinkLow: 800,
        reverbWet: 0.2,
        waveLfoFreq: 0.04,
      },
      {
        label: "Waves",
        pinkHigh: 200,
        pinkLow: 1200,
        reverbWet: 0.4,
        waveLfoFreq: 0.1,
      },
      {
        label: "Storm",
        pinkHigh: 400,
        pinkLow: 1800,
        reverbWet: 0.7,
        waveLfoFreq: 0.2,
      },
    ],
  };

  // Tipo para el soundRef basado en la clave del sonido
  type SoundRef = {
    filter?: { frequency: { value: number } };
    highpass?: { frequency: { value: number } };
    lowpass?: { frequency: { value: number } };
    reverb?: { wet: { value: number } };
    pinkHighpass?: { frequency: { value: number } };
    pinkLowpass?: { frequency: { value: number } };
    waveLFO?: { frequency: { value: number } };
  };

  const applyPreset = useCallback(
    (soundKey: keyof PresetsMap, soundRef: SoundRef | null, preset: Preset) => {
      if (!soundRef) return;
      
      if (soundKey === 'brown' && 'filterFreq' in preset) {
        if (soundRef.filter) {
          soundRef.filter.frequency.value = preset.filterFreq;
        }
      } else if (soundKey === 'rain' && 'highpass' in preset && 'lowpass' in preset) {
        if (soundRef.highpass) {
          soundRef.highpass.frequency.value = preset.highpass;
        }
        if (soundRef.lowpass) {
          soundRef.lowpass.frequency.value = preset.lowpass;
        }
        if (soundRef.reverb && 'reverbWet' in preset) {
          soundRef.reverb.wet.value = preset.reverbWet;
        }
      } else if (soundKey === 'ocean' && 'pinkHigh' in preset && 'pinkLow' in preset) {
        if (soundRef.pinkHighpass) {
          soundRef.pinkHighpass.frequency.value = preset.pinkHigh;
        }
        if (soundRef.pinkLowpass) {
          soundRef.pinkLowpass.frequency.value = preset.pinkLow;
        }
        if (soundRef.reverb) {
          soundRef.reverb.wet.value = preset.reverbWet;
        }
        if (soundRef.waveLFO && 'waveLfoFreq' in preset && preset.waveLfoFreq !== undefined) {
          soundRef.waveLFO.frequency.value = preset.waveLfoFreq;
        }
      }
    },
    []
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Noise Generator Settings"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {sounds.map((sound, idx) => (
          <div
            key={sound.key}
            className="mb-4 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
          >
            <div className="flex items-center gap-2 mb-2">
              {sound.icon === "Cloud" ? (
                <Cloud size={22} />
              ) : sound.icon === "CloudRain" ? (
                <CloudRain size={22} />
              ) : (
                <Waves size={22} />
              )}
              <span className="font-semibold text-[var(--text-primary)]">
                {sound.label}
              </span>
            </div>

            {/* Max volume */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-[var(--text-secondary)]">
                Max Volume:
              </span>
              <input
                type="number"
                min={0.1}
                max={5}
                step={0.1}
                value={maxVolumes[idx]}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setMaxVolumes((vols) =>
                    vols.map((v, i) => (i === idx ? value : v))
                  );
                  if (sound.volume > value) setVolume(idx, value);
                }}
                className="w-16 px-2 py-1 rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            {/* Presets */}
            <div className="flex gap-2 mt-1">
              {presetsMap[sound.key as keyof PresetsMap].map(
                (preset: Preset, pIdx: number) => (
                  <button
                    key={preset.label}
                    className={`px-2 py-1 rounded border text-sm transition ${
                      selectedPresets[idx] === pIdx
                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                        : "bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-white"
                    }`}
                    onClick={() => {
                      applyPreset(sound.key as keyof PresetsMap, sound.soundRef, preset);
                      setSelectedPresets((sel) =>
                        sel.map((v, i) => (i === idx ? pIdx : v)) as [number, number, number]
                      );
                    }}
                  >
                    {preset.label}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}

// -------------------------
// NoiseGenerator main
// -------------------------
export default function NoiseGenerator() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    sounds,
    startSound,
    stopSound,
    setVolume,
    isInitialized,
    initializeAudio,
  } = useNoise();

  // Check if any sound is playing
  const anySoundPlaying = sounds.some(sound => sound.isPlaying);

  // Play/Pause all sounds
  const handlePlayPauseAll = useCallback(async () => {
    if (!isInitialized) await initializeAudio();

    if (anySoundPlaying) {
      // Pause all playing sounds
      sounds.forEach((sound, idx) => {
        if (sound.isPlaying) {
          stopSound(idx);
        }
      });
    } else {
      // Start all sounds
      sounds.forEach((sound, idx) => {
        startSound(idx);
      });
    }
  }, [anySoundPlaying, sounds, startSound, stopSound, isInitialized, initializeAudio]);

  // Max volumes
  const [maxVolumes, setMaxVolumes] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("noiseMaxVolumes");
      const arr = saved ? JSON.parse(saved) : null;
      if (Array.isArray(arr) && arr.length === 3) return arr;
    } catch {}
    return [4, 4, 4];
  });

  useEffect(
    () => localStorage.setItem("noiseMaxVolumes", JSON.stringify(maxVolumes)),
    [maxVolumes]
  );

  const handleStart = useCallback(
    async (index: number) => {
      if (!isInitialized) await initializeAudio();
      startSound(index);
    },
    [isInitialized, initializeAudio, startSound]
  );

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]"
      >
        {/* Play/Pause All button */}
        <button
          onClick={handlePlayPauseAll}
          className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label={anySoundPlaying ? "Pause all sounds" : "Play all sounds"}
        >
          {anySoundPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* Title centered */}
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] text-center">
            Noise Generator
          </h3>
        </div>

        {/* Settings button */}
        <button
          className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Noise generator settings"
        >
          <MoreVertical size={20} />
        </button>
      </motion.div>

      {/* Sound controls */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col justify-center space-y-4 py-2"
      >
        {sounds.map((sound, idx) => (
          <motion.div key={sound.key} variants={item}>
            <SoundControl
              label={sound.label}
              icon={
                sound.icon === "Cloud"
                  ? Cloud
                  : sound.icon === "CloudRain"
                  ? CloudRain
                  : Waves
              }
              volume={sound.volume}
              setVolume={(vol) => setVolume(idx, vol)}
              isPlaying={sound.isPlaying}
              start={() => handleStart(idx)}
              stop={() => stopSound(idx)}
              className={sound.key === "ocean" ? "mb-2" : ""}
              max={maxVolumes[idx] || 4}
            />
          </motion.div>
        ))}
      </motion.div>

{/* Settings modal */}
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
