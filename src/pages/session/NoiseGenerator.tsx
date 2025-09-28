import {
  AudioLines,
  Cloud,
  CloudRain,
  MoreVertical,
  Pause,
  Play,
  SquareArrowOutUpRight,
  Waves,
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import ReactSlider from "react-slider";
import { motion } from "framer-motion";

import SectionTitle from "@/components/SectionTitle";
import BaseModal from "@/modals/BaseModal";
import { useNoise } from "@/utils/NoiseContext";

// -------------------------
// SoundControl component
// -------------------------
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
}: {
  label: string;
  icon: React.FC<any>;
  volume: number;
  setVolume: (vol: number) => void;
  isPlaying: boolean;
  start: () => void;
  stop: () => void;
  className?: string;
  max: number;
}) {
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
  const [selectedPresets, setSelectedPresets] = useState([0, 0, 0]);

  const presetsMap = {
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

  const applyPreset = useCallback(
    (soundKey: string, soundRef: any, preset: any) => {
      if (!soundRef) return;
      switch (soundKey) {
        case "brown":
          if (soundRef.filter)
            soundRef.filter.frequency.value = preset.filterFreq;
          break;
        case "rain":
          if (soundRef.highpass)
            soundRef.highpass.frequency.value = preset.highpass;
          if (soundRef.lowpass)
            soundRef.lowpass.frequency.value = preset.lowpass;
          if (soundRef.reverb) soundRef.reverb.wet.value = preset.reverbWet;
          break;
        case "ocean":
          if (soundRef.pinkHighpass)
            soundRef.pinkHighpass.frequency.value = preset.pinkHigh;
          if (soundRef.pinkLowpass)
            soundRef.pinkLowpass.frequency.value = preset.pinkLow;
          if (soundRef.reverb) soundRef.reverb.wet.value = preset.reverbWet;
          if (soundRef.waveLFO && preset.waveLfoFreq)
            soundRef.waveLFO.frequency.value = preset.waveLfoFreq;
          break;
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
              {(presetsMap as any)[sound.key].map(
                (preset: any, pIdx: number) => (
                  <button
                    key={preset.label}
                    className={`px-2 py-1 rounded border text-sm transition ${
                      selectedPresets[idx] === pIdx
                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                        : "bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-white"
                    }`}
                    onClick={() => {
                      applyPreset(sound.key, sound.soundRef, preset);
                      setSelectedPresets((sel) =>
                        sel.map((v, i) => (i === idx ? pIdx : v))
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

  // Max volumes
  const [maxVolumes, setMaxVolumes] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("noiseMaxVolumes");
      const arr = saved ? JSON.parse(saved) : null;
      if (Array.isArray(arr) && arr.length === 3) return arr;
    } catch {}
    return [2, 4, 4];
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

      {/* Sound controls */}
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
              max={maxVolumes[idx]}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* External link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full flex justify-center"
      >
        <button
          className="text-[var(--accent-primary)] font-semibold hover:opacity-80 transition flex items-center gap-2"
          onClick={() =>
            window.open(
              "https://music4study.vercel.app/",
              "_blank",
              "noopener,noreferrer"
            )
          }
          type="button"
        >
          More Sounds <SquareArrowOutUpRight size={16} />
        </button>
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
