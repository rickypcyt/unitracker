import {
  Cloud,
  CloudRain,
  Headphones,
  Pause,
  Play,
  SlidersHorizontal,
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

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

type IconComponent = React.ComponentType<IconProps>;

interface SoundControlProps {
  soundKey: string;
  label: string;
  icon: IconComponent;
  volume: number;
  setVolume: (vol: number) => void;
  isPlaying: boolean;
  start: () => void;
  stop: () => void;
  max: number;
}

const SOUND_THEMES = {
  brown: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
    gradient: "bg-gradient-to-r from-amber-400 to-amber-600",
    activeBorder: "border-amber-500/40",
    activeRing: "ring-amber-500/30",
    badge: "bg-amber-500/10",
    badgeText: "text-amber-600 dark:text-amber-400",
  },
  rain: {
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
    gradient: "bg-gradient-to-r from-blue-400 to-blue-600",
    activeBorder: "border-blue-500/40",
    activeRing: "ring-blue-500/30",
    badge: "bg-blue-500/10",
    badgeText: "text-blue-600 dark:text-blue-400",
  },
  ocean: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-600 dark:text-cyan-400",
    gradient: "bg-gradient-to-r from-cyan-400 to-cyan-600",
    activeBorder: "border-cyan-500/40",
    activeRing: "ring-cyan-500/30",
    badge: "bg-cyan-500/10",
    badgeText: "text-cyan-600 dark:text-cyan-400",
  },
};

type SoundTheme = (typeof SOUND_THEMES)[keyof typeof SOUND_THEMES];

function getSoundTheme(key: string): SoundTheme {
  return SOUND_THEMES[key as keyof typeof SOUND_THEMES] ?? SOUND_THEMES.brown;
}

function SoundControl({
  soundKey,
  label,
  icon: Icon,
  volume,
  setVolume,
  isPlaying,
  start,
  stop,
  max,
}: SoundControlProps) {
  const theme = getSoundTheme(soundKey);
  const percentage = Math.round((volume / max) * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`relative rounded-2xl border bg-[var(--bg-primary)] p-4 transition-all duration-300 hover:shadow-lg ${
        isPlaying
          ? `${theme.activeBorder} shadow-md ring-1 ${theme.activeRing}`
          : "border-[var(--border-primary)]"
      }`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={isPlaying ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${theme.iconBg}`}
        >
          <Icon size={22} className={theme.iconText} />
          {isPlaying && (
            <span
              className={`absolute inset-0 rounded-full ${theme.activeRing} animate-ping opacity-40`}
            />
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-semibold text-[var(--text-primary)] truncate">
              {label}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${theme.badge} ${theme.badgeText}`}
            >
              {percentage}%
            </span>
          </div>

          <ReactSlider
            className="h-2 w-full bg-[var(--bg-secondary)] rounded-full"
            thumbClassName="h-5 w-5 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--accent-primary)] shadow-md cursor-pointer -translate-y-1.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
            trackClassName="h-2 rounded-full"
            renderTrack={(
              props: { key?: React.Key } & React.HTMLProps<HTMLDivElement>,
              state: { index: number }
            ) => {
              const { key, ...rest } = props;
              return (
                <div
                  key={key}
                  {...rest}
                  className={`h-2 rounded-full ${
                    state.index === 0
                      ? theme.gradient
                      : "bg-[var(--bg-secondary)]"
                  }`}
                />
              );
            }}
            min={0}
            max={max}
            step={0.01}
            value={volume}
            onChange={(v) => setVolume(Array.isArray(v) ? v[0] ?? 0 : v)}
            renderThumb={(props) => {
              const { key, ...rest } = props;
              return <div key={key} {...rest} />;
            }}
          />
        </div>

        <button
          type="button"
          onClick={isPlaying ? stop : start}
          aria-label={isPlaying ? `Stop ${label}` : `Play ${label}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 ${
            isPlaying
              ? `${theme.iconBg} ${theme.iconText}`
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)]"
          }`}
        >
          {isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-0.5" />
          )}
        </button>
      </div>
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
    (soundKey: keyof PresetsMap, soundRef: SoundRef | null | undefined, preset: Preset) => {
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
      title="Noise Settings"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {sounds.map((sound, idx) => {
          const theme = getSoundTheme(sound.key);
          const Icon =
            sound.icon === "Cloud"
              ? Cloud
              : sound.icon === "CloudRain"
              ? CloudRain
              : Waves;

          return (
            <div
              key={sound.key}
              className={`rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 transition-all ${
                sound.isPlaying ? `ring-1 ${theme.activeRing}` : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${theme.iconBg}`}
                >
                  <Icon size={18} className={theme.iconText} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--text-primary)]">
                    {sound.label}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Max volume and presets
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-[var(--text-secondary)]">
                  Max volume
                </label>
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
                  className="w-20 px-3 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {presetsMap[sound.key as keyof PresetsMap].map(
                  (preset: Preset, pIdx: number) => (
                    <button
                      key={preset.label}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        selectedPresets[idx] === pIdx
                          ? `${theme.iconBg} ${theme.iconText} ring-1 ${theme.activeRing}`
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]"
                      }`}
                      onClick={() => {
                        applyPreset(
                          sound.key as keyof PresetsMap,
                          sound.soundRef,
                          preset
                        );
                        setSelectedPresets((sel) =>
                          sel.map((v, i) =>
                            i === idx ? pIdx : v
                          ) as [number, number, number]
                        );
                      }}
                    >
                      {preset.label}
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
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
      sounds.forEach((_sound, idx) => {
        if (_sound.isPlaying) {
          stopSound(idx);
        }
      });
    } else {
      // Start all sounds
      sounds.forEach((_sound, idx) => {
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
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pb-3"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <Headphones size={18} className="text-[var(--accent-primary)]" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-tight">
              Noise Generator
            </h3>
            {anySoundPlaying && (
              <span className="text-[11px] text-[var(--accent-primary)] font-medium">
                {sounds.filter(s => s.isPlaying).length} active
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPauseAll}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
              anySoundPlaying
                ? "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-deep)] shadow-md"
                : "bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50"
            }`}
            aria-label={anySoundPlaying ? "Pause all sounds" : "Play all sounds"}
          >
            {anySoundPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span className="hidden sm:inline">
              {anySoundPlaying ? "Pause all" : "Play all"}
            </span>
          </button>

          <button
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Noise generator settings"
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </motion.div>

      {/* Sound controls */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col justify-center gap-4 py-4"
      >
        {sounds.map((sound, idx) => (
          <motion.div key={sound.key} variants={item}>
            <SoundControl
              soundKey={sound.key}
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
