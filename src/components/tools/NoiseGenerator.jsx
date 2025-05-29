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
    max: 3,
    defaultVolume: 1.5,
    volumeMultiplier: 0.5,
    create: (volume, masterGain) => {
      const noise = new Tone.Noise("brown").start();
      const filter = new Tone.Filter(200, "lowpass");
      const limiter = new Tone.Limiter(-3).toDestination();
      const gain = new Tone.Gain(volume);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(limiter);
      return { noise, filter, gain, limiter };
    }
  },
  {
    key: "rain",
    label: "Rain Sound",
    icon: CloudRain,
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 0.2,
    create: (volume, masterGain) => {
      // Main rain noise
      const noise = new Tone.Noise("pink").start();
      const highpass = new Tone.Filter(200, "highpass");
      const lowpass = new Tone.Filter(1500, "lowpass");
      
      // Ambient layer
      const ambientNoise = new Tone.Noise("brown").start();
      const ambientFilter = new Tone.Filter(100, "lowpass");
      const ambientGain = new Tone.Gain(0.2);
      
      // Spatial effects
      const reverb = new Tone.Reverb({
        decay: 2,
        wet: 0.2,
        preDelay: 0.1
      }).toDestination();
      
      // Main gain
      const gain = new Tone.Gain(volume * 0.2).connect(reverb);
      
      // Connect main rain
      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      
      // Connect ambient
      ambientNoise.connect(ambientFilter);
      ambientFilter.connect(ambientGain);
      ambientGain.connect(gain);
      
      return { 
        noise, 
        highpass, 
        lowpass, 
        ambientNoise,
        ambientFilter,
        ambientGain,
        gain,
        reverb
      };
    }
  },
  {
    key: "ocean",
    label: "Ocean Waves",
    icon: Waves,
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 0.2,
    create: (volume, masterGain) => {
      // Main wave noise (pink for mid-high frequencies)
      const pinkNoise = new Tone.Noise("pink").start();
      const pinkHighpass = new Tone.Filter(200, "highpass");
      const pinkLowpass = new Tone.Filter(1200, "lowpass");
      
      // Deep wave noise (brown for low frequencies)
      const brownNoise = new Tone.Noise("brown").start();
      const brownFilter = new Tone.Filter(150, "lowpass");
      
      // Slow amplitude modulation for wave cycles
      const waveLFO = new Tone.LFO({
        frequency: 0.1,
        min: 0.3,
        max: 0.8,
        type: "sine"
      }).start();
      
      // Random variation in wave timing
      const randomLFO = new Tone.LFO({
        frequency: 0.05,
        min: 0.08,
        max: 0.12,
        type: "sine"
      }).start();
      randomLFO.connect(waveLFO.frequency);
      
      // Wave breaking effect
      const breakingNoise = new Tone.Noise("pink").start();
      const breakingFilter = new Tone.Filter(500, "bandpass");
      const breakingGain = new Tone.Gain(0.15);
      
      // Splash effect
      const splashNoise = new Tone.Noise("white").start();
      const splashFilter = new Tone.Filter(2000, "bandpass");
      const splashGain = new Tone.Gain(0.1);
      
      // Spatial effects
      const reverb = new Tone.Reverb({
        decay: 4,
        wet: 0.4,
        preDelay: 0.2
      }).toDestination();
      
      // Main gain with wave modulation
      const gain = new Tone.Gain(volume * 0.2).connect(reverb);
      waveLFO.connect(gain.gain);
      
      // Connect main wave components
      pinkNoise.connect(pinkHighpass);
      pinkHighpass.connect(pinkLowpass);
      pinkLowpass.connect(gain);
      
      brownNoise.connect(brownFilter);
      brownFilter.connect(gain);
      
      // Connect breaking wave
      breakingNoise.connect(breakingFilter);
      breakingFilter.connect(breakingGain);
      breakingGain.connect(gain);
      
      // Connect splash effect
      splashNoise.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(gain);
      
      return { 
        pinkNoise, 
        pinkHighpass, 
        pinkLowpass,
        brownNoise,
        brownFilter,
        breakingNoise,
        breakingFilter,
        breakingGain,
        splashNoise,
        splashFilter,
        splashGain,
        gain,
        waveLFO,
        randomLFO,
        reverb
      };
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
      // Si el volumen es 0, detener todos los sonidos
      if (volume === 0) {
        Object.values(soundRef.current).forEach(node => {
          if (node instanceof Tone.Noise) {
            node.stop();
          }
        });
      } else {
        // Si el volumen no es 0, asegurarse de que los sonidos estén activos
        Object.values(soundRef.current).forEach(node => {
          if (node instanceof Tone.Noise && !node.started) {
            node.start();
          }
        });
      }
      // Actualizar el volumen
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
function SoundControl({ label, icon: Icon, min, max, volume, setVolume, isPlaying, start, stop, className }) {
  return (
    <div className={`bar ${className || ''}`}>
      <label className="noisegentitle flex items-center gap-2">
        <Icon size={20} className="text-white" />
        <span className="card-text font-medium text-white text-base sm:text-md">{label}</span>
      </label>
      <div className="slider flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step="0.01"
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="w-8 flex justify-center">
          {!isPlaying ? (
            <button
              type="button"
              onClick={start}
              className="text-white hover:text-neutral-300 transition-colors"
            >
              <Play size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="text-blue-500 hover:text-blue-400 transition-colors"
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
    <div className="maincard p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-white">
          <AudioLines size={24} className="text-white" />
          Noise Generator
        </h2>
        <button
          type="button"
          onClick={toggleAllSounds}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors duration-200 text-base sm:text-base"
        >
          {allPlaying ? (
            <>
              <Pause size={18} />
              <span>Stop All</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Play All</span>
            </>
          )}
        </button>
      </div>
      <div className="space-y-6">
        <div className="space-y-6">
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
              className={config.key === 'ocean' ? 'mb-2' : ''}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
