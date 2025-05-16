import React, { useState, useRef, useEffect } from "react";
import { AudioLines, Play, Pause, Cloud, CloudRain, Waves } from "lucide-react";
import * as Tone from "tone";

// Configuración de cada sonido
const SOUND_CONFIGS = [
  {
    key: "brown",
    label: "Brown Noise",
    icon: Cloud,
    min: 0,
    max: 5,
    defaultVolume: 2.5,
    volumeMultiplier: 1,
    create: (volume, masterGain) => {
      const noise = new Tone.Noise("brown").start();
      const filter = new Tone.Filter(200, "lowpass");
      const gain = new Tone.Gain(volume);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      return { noise, filter, gain };
    }
  },
  {
    key: "rain",
    label: "Rain Sound",
    icon: CloudRain,
    min: 0,
    max: 25,
    defaultVolume: 12.5,
    volumeMultiplier: 0.04,
    create: (volume, masterGain) => {
      const noise = new Tone.Noise("pink").start();
      const highpass = new Tone.Filter(200, "highpass");
      const lowpass = new Tone.Filter(2000, "lowpass");
      const gain = new Tone.Gain(volume * 0.02);
      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(masterGain);
      return { noise, highpass, lowpass, gain };
    }
  },
  {
    key: "ocean",
    label: "Ocean Waves",
    icon: Waves,
    min: 0,
    max: 25,
    defaultVolume: 12.5,
    volumeMultiplier: 0.03,
    create: (volume, masterGain) => {
      const noise = new Tone.Noise("pink").start();
      const filter = new Tone.Filter(300, "lowpass");
      const lfo = new Tone.LFO({ frequency: 0.1, min: 200, max: 400, type: "sine" }).start();
      lfo.connect(filter.frequency);
      const reverb = new Tone.Reverb({ decay: 4, wet: 0.3, preDelay: 0.2 }).toDestination();
      const gain = new Tone.Gain(volume * 0.03);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(reverb);
      return { noise, filter, gain, lfo, reverb };
    }
  }
];

// Hook reutilizable para sonidos individuales
function useSound(config, masterGain) {
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(config.key + "Volume");
    return saved ? parseFloat(saved) : config.defaultVolume;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(config.key + "Volume", volume.toString());
    if (soundRef.current?.gain) {
      soundRef.current.gain.gain.value = volume * config.volumeMultiplier;
    }
  }, [volume, config.volumeMultiplier, config.key]);

  const start = async () => {
    if (!masterGain.current) {
      masterGain.current = new Tone.Gain(1).toDestination();
    }
    await Tone.start();
    if (!soundRef.current) {
      soundRef.current = config.create(volume, masterGain.current);
    }
    setIsPlaying(true);
  };

  const stop = () => {
    if (soundRef.current) {
      Object.values(soundRef.current).forEach(node => node.dispose && node.dispose());
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => () => stop(), []); // Limpieza al desmontar

  return { volume, setVolume, isPlaying, start, stop };
}

// Componente de control para cada sonido
function SoundControl({ label, icon: Icon, min, max, volume, setVolume, isPlaying, start, stop }) {
  return (
    <div className="bar">
      <label className="noisegentitle">
        <Icon size={18} />
        <span className="card-text font-medium text-white text-md">{label}</span>
      </label>
      <div className="slider">
        <input
          type="range"
          min={min}
          max={max}
          step="0.01"
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
        />
        <div className="w-8 flex justify-center">
          {!isPlaying ? (
            <button
              type="button"
              onClick={start}
              className="text-white hover:text-accent-secondary"
            >
              <Play size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="text-accent-tertiary hover:text-accent-secondary"
            >
              <Pause size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function NoiseGenerator() {
  const masterGainRef = useRef(null);
  const soundHooks = SOUND_CONFIGS.map(config => useSound(config, masterGainRef));
  const allPlaying = soundHooks.every(hook => hook.isPlaying);

  // Play/Pause All
  const toggleAllSounds = async () => {
    if (!masterGainRef.current) {
      masterGainRef.current = new Tone.Gain(1).toDestination();
      await Tone.start();
    }
    if (allPlaying) {
      soundHooks.forEach(hook => hook.stop());
    } else {
      await Tone.start();
      soundHooks.forEach(hook => !hook.isPlaying && hook.start());
    }
  };

  // Mantener el estado de "Play All" sincronizado
  useEffect(() => {
    // Si todos están activos, allPlaying será true; si alguno se apaga, será false
  }, [soundHooks.map(hook => hook.isPlaying).join()]);

  // Limpieza global
  useEffect(() => {
    return () => {
      soundHooks.forEach(hook => hook.stop());
      if (masterGainRef.current) {
        masterGainRef.current.dispose();
      }
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="maincard">
      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold flex items-center gap-2"><AudioLines size={24} />Noise Generator</h2>
        <button
          type="button"
          onClick={toggleAllSounds}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors duration-200"
        >
          {allPlaying ? (
            <>
              <Pause size={16} />
              <span className="text-base">Stop All</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span className="text-base">Play All</span>
            </>
          )}
        </button>
      </div>
      <div className="mb-3 space-y-6 pr-2">
        {SOUND_CONFIGS.map((config, idx) => (
          <SoundControl
            key={config.key}
            label={config.label}
            icon={config.icon}
            min={config.min}
            max={config.max}
            volume={soundHooks[idx].volume}
            setVolume={soundHooks[idx].setVolume}
            isPlaying={soundHooks[idx].isPlaying}
            start={soundHooks[idx].start}
            stop={soundHooks[idx].stop}
          />
        ))}
      </div>
    </div>
  );
}
