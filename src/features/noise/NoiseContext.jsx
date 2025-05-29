import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import * as Tone from "tone";

// Configuración de cada sonido
const SOUND_CONFIGS = [
  {
    key: "brown",
    label: "Brown Noise",
    icon: "Cloud",
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
    icon: "CloudRain",
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 0.2,
    create: (volume, masterGain) => {
      const noise = new Tone.Noise("pink").start();
      const highpass = new Tone.Filter(200, "highpass");
      const lowpass = new Tone.Filter(1500, "lowpass");
      const ambientNoise = new Tone.Noise("brown").start();
      const ambientFilter = new Tone.Filter(100, "lowpass");
      const ambientGain = new Tone.Gain(0.2);
      const reverb = new Tone.Reverb({
        decay: 2,
        wet: 0.2,
        preDelay: 0.1
      }).toDestination();
      const gain = new Tone.Gain(volume * 0.2).connect(reverb);
      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
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
    icon: "Waves",
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 0.2,
    create: (volume, masterGain) => {
      const pinkNoise = new Tone.Noise("pink").start();
      const pinkHighpass = new Tone.Filter(200, "highpass");
      const pinkLowpass = new Tone.Filter(1200, "lowpass");
      const brownNoise = new Tone.Noise("brown").start();
      const brownFilter = new Tone.Filter(150, "lowpass");
      const waveLFO = new Tone.LFO({
        frequency: 0.1,
        min: 0.3,
        max: 0.8,
        type: "sine"
      }).start();
      const randomLFO = new Tone.LFO({
        frequency: 0.05,
        min: 0.08,
        max: 0.12,
        type: "sine"
      }).start();
      randomLFO.connect(waveLFO.frequency);
      const breakingNoise = new Tone.Noise("pink").start();
      const breakingFilter = new Tone.Filter(500, "bandpass");
      const breakingGain = new Tone.Gain(0.15);
      const splashNoise = new Tone.Noise("white").start();
      const splashFilter = new Tone.Filter(2000, "bandpass");
      const splashGain = new Tone.Gain(0.1);
      const reverb = new Tone.Reverb({
        decay: 4,
        wet: 0.4,
        preDelay: 0.2
      }).toDestination();
      const gain = new Tone.Gain(volume * 0.2).connect(reverb);
      waveLFO.connect(gain.gain);
      pinkNoise.connect(pinkHighpass);
      pinkHighpass.connect(pinkLowpass);
      pinkLowpass.connect(gain);
      brownNoise.connect(brownFilter);
      brownFilter.connect(gain);
      breakingNoise.connect(breakingFilter);
      breakingFilter.connect(breakingGain);
      breakingGain.connect(gain);
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

const NoiseContext = createContext();

export function NoiseProvider({ children }) {
  const masterGainRef = useRef(null);
  const [sounds, setSounds] = useState(() => 
    SOUND_CONFIGS.map(config => ({
      ...config,
      volume: parseFloat(localStorage.getItem(config.key + "Volume")) || config.defaultVolume,
      isPlaying: localStorage.getItem(config.key + "IsPlaying") === "true",
      soundRef: null
    }))
  );

  const startSound = async (index) => {
    const sound = sounds[index];
    if (!masterGainRef.current) {
      masterGainRef.current = new Tone.Gain(1).toDestination();
    }
    await Tone.start();
    if (!sound.soundRef) {
      sound.soundRef = sound.create(sound.volume, masterGainRef.current);
    }
    setSounds(prev => {
      const newSounds = [...prev];
      newSounds[index] = { ...sound, isPlaying: true };
      return newSounds;
    });
    localStorage.setItem(sound.key + "IsPlaying", "true");
  };

  const stopSound = (index) => {
    const sound = sounds[index];
    if (sound.soundRef) {
      // Detener todos los nodos de ruido
      Object.values(sound.soundRef).forEach(node => {
        if (node instanceof Tone.Noise) {
          node.stop();
        }
        if (node instanceof Tone.LFO) {
          node.stop();
        }
        if (node.dispose) {
          node.dispose();
        }
      });
      sound.soundRef = null;
    }
    setSounds(prev => {
      const newSounds = [...prev];
      newSounds[index] = { ...sound, isPlaying: false };
      return newSounds;
    });
    localStorage.setItem(sound.key + "IsPlaying", "false");
  };

  const setVolume = (index, volume) => {
    const sound = sounds[index];
    setSounds(prev => {
      const newSounds = [...prev];
      newSounds[index] = { ...sound, volume };
      return newSounds;
    });
    localStorage.setItem(sound.key + "Volume", volume.toString());
    
    if (sound.soundRef) {
      // Si el volumen es 0, detener todos los sonidos
      if (volume === 0) {
        Object.values(sound.soundRef).forEach(node => {
          if (node instanceof Tone.Noise) {
            node.stop();
          }
          if (node instanceof Tone.LFO) {
            node.stop();
          }
        });
      } else {
        // Si el volumen no es 0, asegurarse de que los sonidos estén activos
        Object.values(sound.soundRef).forEach(node => {
          if (node instanceof Tone.Noise && !node.started) {
            node.start();
          }
          if (node instanceof Tone.LFO && !node.started) {
            node.start();
          }
        });
      }
      // Actualizar el volumen
      if (sound.soundRef.gain) {
        sound.soundRef.gain.gain.value = volume * sound.volumeMultiplier;
      }
    }
  };

  const toggleAllSounds = async () => {
    const allPlaying = sounds.every(sound => sound.isPlaying);
    if (allPlaying) {
      sounds.forEach((_, index) => stopSound(index));
    } else {
      await Tone.start();
      sounds.forEach((sound, index) => !sound.isPlaying && startSound(index));
    }
  };

  // Iniciar sonidos que estaban reproduciéndose
  useEffect(() => {
    sounds.forEach((sound, index) => {
      if (sound.isPlaying) {
        startSound(index);
      }
    });
  }, []);

  // Limpieza global
  useEffect(() => {
    return () => {
      sounds.forEach(sound => {
        if (sound.soundRef) {
          Object.values(sound.soundRef).forEach(node => node.dispose && node.dispose());
        }
      });
      if (masterGainRef.current) {
        masterGainRef.current.dispose();
      }
    };
  }, []);

  return (
    <NoiseContext.Provider value={{
      sounds,
      startSound,
      stopSound,
      setVolume,
      toggleAllSounds
    }}>
      {children}
    </NoiseContext.Provider>
  );
}

export function useNoise() {
  const context = useContext(NoiseContext);
  if (!context) {
    throw new Error("useNoise must be used within a NoiseProvider");
  }
  return context;
} 