import {
  Cloud,
  CloudRain,
  Headphones,
  Pause,
  Play,
  Waves,
} from "lucide-react";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

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
  index: number;
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
    thumb: "bg-amber-500 focus:ring-amber-500/40",
    buttonHover:
      "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400",
  },
  rain: {
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
    gradient: "bg-gradient-to-r from-blue-400 to-blue-600",
    activeBorder: "border-blue-500/40",
    activeRing: "ring-blue-500/30",
    badge: "bg-blue-500/10",
    badgeText: "text-blue-600 dark:text-blue-400",
    thumb: "bg-blue-500 focus:ring-blue-500/40",
    buttonHover:
      "hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400",
  },
  ocean: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-600 dark:text-cyan-400",
    gradient: "bg-gradient-to-r from-cyan-400 to-cyan-600",
    activeBorder: "border-cyan-500/40",
    activeRing: "ring-cyan-500/30",
    badge: "bg-cyan-500/10",
    badgeText: "text-cyan-600 dark:text-cyan-400",
    thumb: "bg-cyan-500 focus:ring-cyan-500/40",
    buttonHover:
      "hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400",
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
  index,
}: SoundControlProps) {
  const theme = getSoundTheme(soundKey);
  const percentage = Math.round((volume / max) * 100);

  return (
    <motion.div
      className={`noise-item relative overflow-hidden rounded-2xl border bg-[var(--bg-primary)] p-4 transition-all duration-300 hover:shadow-md ${
        isPlaying
          ? `${theme.activeBorder} shadow-md ring-1 ${theme.activeRing}`
          : "border-[var(--border-primary)]"
      }`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
            delay: index * 0.15,
          }}
          className={`noise-icon relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${theme.iconBg}`}
        >
          <Icon size={22} className={theme.iconText} />
          {isPlaying && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.35, 0], scale: [1, 1.5] }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
                delay: index * 0.15,
              }}
              className={`absolute inset-0 rounded-full ${theme.activeRing}`}
            />
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="noise-item-head flex items-center justify-between gap-2 mb-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="font-semibold text-[var(--text-primary)] truncate">
              {label}
            </span>
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-3.5 shrink-0" aria-hidden>
                {[0, 1, 2, 3].map((b) => (
                  <motion.span
                    key={b}
                    className={`w-0.5 rounded-full ${theme.gradient}`}
                    animate={{ height: ["30%", "100%", "50%", "90%", "30%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      ease: "easeInOut",
                      delay: b * 0.15,
                    }}
                  />
                ))}
              </div>
            )}
            </div>
            <span
              className={`shrink-0 text-xs font-medium tabular-nums px-2.5 py-0.5 rounded-full ${theme.badge} ${theme.badgeText}`}
            >
              {percentage}%
            </span>
          </div>

          <ReactSlider
            className="h-2 w-full bg-[var(--border-primary)] rounded-full"
            thumbClassName={`h-5 w-5 rounded-full ${theme.thumb} border-2 border-[var(--bg-primary)] shadow-md cursor-pointer -translate-y-1.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2`}
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
                  className={`h-2 rounded-full transition-opacity ${
                    state.index === 0
                      ? theme.gradient
                      : "bg-[var(--border-primary)]"
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
          className={`noise-play flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 ${
            isPlaying
              ? `${theme.iconBg} ${theme.iconText}`
              : `bg-[var(--bg-secondary)] text-[var(--text-secondary)] ${theme.buttonHover}`
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
// NoiseGenerator main
// -------------------------
export default function NoiseGenerator() {
  const { t } = useTranslation();
  const {
    sounds,
    startSound,
    stopSound,
    setVolume,
    isInitialized,
    initializeAudio,
  } = useNoise();

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
        className="noise-header flex items-center justify-between pb-3"
      >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
              <Headphones size={18} className="text-[var(--accent-primary)]" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-tight">
              {t('session.noise.title')}
            </h3>
          </div>

      </motion.div>

      {/* Sound controls */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="noise-list flex flex-col gap-3 py-2"
      >
        {sounds.map((sound, idx) => (
          <motion.div key={sound.key} variants={item}>
            <SoundControl
              index={idx}
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
              max={sound.max}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
