import * as Tone from "tone";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// -------------------------
// Configuración de sonidos
// -------------------------
const SOUND_CONFIGS = [
  {
    key: "brown",
    label: "Brown Noise",
    icon: "Cloud",
    min: 0,
    max: 3,
    defaultVolume: 1.5,
    volumeMultiplier: 0.5,
    create: (volume: number) => {
      // Clean deep foundation (very low frequencies, smooth)
      const deepBrown = new Tone.Noise("brown").start();
      const deepFilter = new Tone.Filter(60, "lowpass", -24);
      deepFilter.Q.value = 0.2;
      const deepGain = new Tone.Gain(0.3);

      // Main clean brown (low frequencies, gentle slope)
      const mainBrown = new Tone.Noise("brown").start();
      const mainFilter = new Tone.Filter(180, "lowpass", -12);
      mainFilter.Q.value = 0.3;
      mainFilter.frequency.value = 180;
      const mainGain = new Tone.Gain(0.5);

      // Soft mid-brown (low-mid frequencies, very gentle)
      const midBrown = new Tone.Noise("brown").start();
      const midFilter = new Tone.Filter(300, "bandpass", -12);
      midFilter.Q.value = 0.5;
      midFilter.gain.value = -6;
      const midGain = new Tone.Gain(0.15);

      // Very gentle variation for smoothness
      const slowLFO = new Tone.LFO(0.015, 0.9, 1.1).start();
      const mediumLFO = new Tone.LFO(0.03, 0.95, 1.05).start();

      // Subtle random modulation for organic feel
      const randomModulation = new Tone.LFO(0.02, 0.01, 0.03).start();
      randomModulation.connect(slowLFO.frequency);

      // Clean high-frequency presence (minimal)
      const highTexture = new Tone.Noise("pink").start();
      const highFilter = new Tone.Filter(1000, "highpass", -24);
      highFilter.Q.value = 0.3;
      highFilter.gain.value = -12;
      const highGain = new Tone.Gain(0.02);
      const highLFO = new Tone.LFO(0.08, 0.01, 0.03).start();
      highLFO.connect(highGain.gain);

      // Additional smoothing filter for overall cleanliness
      const smoothingFilter = new Tone.Filter(500, "lowpass", -12);
      smoothingFilter.Q.value = 0.2;

      // Gentle processing for clean sound
      const limiter = new Tone.Limiter(-6).toDestination();
      const compressor = new Tone.Compressor({
        threshold: -18,
        ratio: 2,
        attack: 0.01,
        release: 0.5,
        knee: 6
      });

      // Main gain with cleaner volume control
      const gain = new Tone.Gain(volume * 0.4).connect(smoothingFilter);
      smoothingFilter.connect(compressor);
      compressor.connect(limiter);

      // Connect gentle LFOs for smooth modulation
      slowLFO.connect(deepGain.gain);
      mediumLFO.connect(mainGain.gain);

      // Connect all noise sources with cleaner routing
      deepBrown.chain(deepFilter, deepGain, gain);
      mainBrown.chain(mainFilter, mainGain, gain);
      midBrown.chain(midFilter, midGain, gain);
      highTexture.chain(highFilter, highGain, gain);

      return {
        deepBrown,
        deepFilter,
        deepGain,
        mainBrown,
        mainFilter,
        mainGain,
        midBrown,
        midFilter,
        midGain,
        highTexture,
        highFilter,
        highGain,
        highLFO,
        slowLFO,
        mediumLFO,
        randomModulation,
        smoothingFilter,
        compressor,
        gain,
        limiter,
      };
    },
  },
  {
    key: "rain",
    label: "Rain Sound",
    icon: "CloudRain",
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 1.0,
    create: (volume: number) => {
      // White noise source for rain drops
      const noise = new Tone.Noise("white").start();
      
      // Band-pass filter for higher pitched rain frequencies
      const filter = new Tone.Filter(2000, "bandpass");
      filter.Q.value = 1.2;
      
      // Amplitude envelope for each rain drop (fast attack, short decay)
      const envelope = new Tone.AmplitudeEnvelope({
        attack: 0.01,    // Quick attack for drop impact
        decay: 0.08,     // Short decay for realistic drop sound
        sustain: 0,      // No sustain - drops don't sustain
        release: 0.03    // Quick release
      });
      
      // Reverb for space and depth
      const reverb = new Tone.Reverb({
        decay: 2.5,
        wet: 0.3,
        preDelay: 0.01
      }).toDestination();
      
      // Main gain control (much louder)
      const gain = new Tone.Gain(volume * 0.8).connect(reverb);
      
      // Connect the signal chain
      noise.connect(filter);
      filter.connect(envelope);
      envelope.connect(gain);
      
      // Random interval generator for natural rain pattern
      let nextDropTime = 0;
      const scheduleRainDrops = (time: number) => {
        // Random interval between drops (50ms to 300ms for moderate rain)
        const interval = Math.random() * 0.25 + 0.05;
        
        // Trigger the envelope for a single drop
        envelope.triggerAttackRelease(0.1, time);
        
        // Schedule next drop
        nextDropTime = time + interval;
        if (nextDropTime < Tone.now() + 60) { // Schedule drops for next minute
          Tone.Transport.schedule(scheduleRainDrops, nextDropTime);
        }
      };
      
      // Start the rain pattern
      Tone.Transport.schedule(scheduleRainDrops, Tone.now());
      
      // Additional continuous rain texture (higher pitched background)
      const backgroundRain = new Tone.Noise("pink").start();
      const backgroundFilter = new Tone.Filter(800, "lowpass");
      backgroundFilter.Q.value = 0.4;
      const backgroundGain = new Tone.Gain(volume * 0.3);
      
      backgroundRain.connect(backgroundFilter);
      backgroundFilter.connect(backgroundGain);
      backgroundGain.connect(reverb);

      return {
        noise,
        filter,
        envelope,
        backgroundRain,
        backgroundFilter,
        backgroundGain,
        gain,
        reverb,
      };
    },
  },
  {
    key: "ocean",
    label: "Ocean Waves",
    icon: "Waves",
    min: 0,
    max: 3,
    defaultVolume: 0.8,
    volumeMultiplier: 0.3,
    create: (volume: number) => {
      // Create master gain first - this will control everything
      const masterGain = new Tone.Gain(0).toDestination();
      
      // Enhanced spatial reverb
      const reverb = new Tone.Reverb({
        decay: 8,
        wet: 0.4,
        preDelay: 0.15,
      }).connect(masterGain);
      
      // Main gain - start at absolute zero
      const gain = new Tone.Gain(0).connect(reverb);
      
      // Deep ocean rumble (very low frequencies) - start muted
      const deepOcean = new Tone.Noise("brown").start();
      deepOcean.volume.value = -Infinity; // Start completely muted
      const deepFilter = new Tone.Filter(80, "lowpass");
      deepFilter.frequency.value = 80;
      deepFilter.Q.value = 0.3;
      const deepGain = new Tone.Gain(0);
      const retreatGain = new Tone.Gain(0);
      const breakingGain = new Tone.Gain(0);
      const foamGain = new Tone.Gain(0);
      const splashGain = new Tone.Gain(0);
      
      // Main ocean waves (low-mid frequencies) - start muted
      const brownNoise = new Tone.Noise("brown").start();
      brownNoise.volume.value = -Infinity; // Start completely muted
      const brownFilter = new Tone.Filter(150, "lowpass");
      brownFilter.frequency.value = 150;
      brownFilter.Q.value = 0.6;
      
      // Ocean surface water (mid frequencies) - start muted
      const pinkNoise = new Tone.Noise("pink").start();
      pinkNoise.volume.value = -Infinity; // Start completely muted
      const pinkHighpass = new Tone.Filter(80, "highpass");
      const pinkLowpass = new Tone.Filter(1200, "lowpass");
      pinkHighpass.frequency.value = 80;
      pinkLowpass.frequency.value = 1200;
      pinkLowpass.Q.value = 0.8;
      
      // Complex wave patterns with multiple LFOs
      const primaryWaveLFO = new Tone.LFO(0.06, 0.5, 0.9).start();
      const secondaryWaveLFO = new Tone.LFO(0.12, 0.3, 0.7).start();
      const randomModulation = new Tone.LFO(0.04, 0.02, 0.08).start();
      randomModulation.connect(primaryWaveLFO.frequency);
      randomModulation.connect(secondaryWaveLFO.frequency);

      // Wave wash/retreat effect (the "swoosh" of waves receding) - start muted
      const waveRetreat = new Tone.Noise("pink").start();
      waveRetreat.volume.value = -Infinity; // Start completely muted
      const retreatFilterRise = new Tone.Filter({
        type: "bandpass",
        frequency: 600,
        Q: 2.0,
        gain: 0
      });
      const retreatFilterFall = new Tone.Filter({
        type: "bandpass", 
        frequency: 300,
        Q: 1.5,
        gain: 0
      });
      
      // Complex LFO for wave wash cycle (rise and fall)
      const washCycleLFO = new Tone.LFO(0.08, 0, 1).start();
      const washFrequencyLFO = new Tone.LFO(0.08, 300, 800).start();
      washFrequencyLFO.connect(retreatFilterRise.frequency);
      
      // Create the wash effect by modulating gain and frequency
      washCycleLFO.connect(retreatGain.gain);

      // Breaking waves (mid-high frequencies) with variation - start muted
      const breakingNoise = new Tone.Noise("pink").start();
      breakingNoise.volume.value = -Infinity; // Start completely muted
      const breakingFilter = new Tone.Filter({
        type: "bandpass",
        frequency: 800,
        Q: 1.5,
        gain: 0
      });
      const breakingLFO = new Tone.LFO(0.15, 0.05, 0.2).start();
      breakingLFO.connect(breakingGain.gain);

      // Foam and bubbles (high frequencies) - start muted
      const foamNoise = new Tone.Noise("white").start();
      foamNoise.volume.value = -Infinity; // Start completely muted
      const foamFilter = new Tone.Filter({
        type: "highpass",
        frequency: 3000,
        Q: 0.5,
        gain: 0
      });
      const foamLFO = new Tone.LFO(0.25, 0.02, 0.1).start();
      foamLFO.connect(foamGain.gain);

      // Water splashes (very high frequencies) - start muted
      const splashNoise = new Tone.Noise("white").start();
      splashNoise.volume.value = -Infinity; // Start completely muted
      const splashFilter = new Tone.Filter({
        type: "bandpass",
        frequency: 4000,
        Q: 1.0,
        gain: 0
      });
      
      primaryWaveLFO.connect(gain.gain);
      secondaryWaveLFO.connect(gain.gain);

      // Connect all noise sources with enhanced routing
      deepOcean.chain(deepFilter, deepGain, gain);
      brownNoise.connect(brownFilter).connect(gain);
      
      pinkNoise.chain(
        pinkHighpass,
        pinkLowpass,
        gain
      );

      // Connect wave wash effect with dual filters for realistic retreat
      waveRetreat.fan(retreatFilterRise, retreatFilterFall);
      retreatFilterRise.connect(retreatGain);
      retreatFilterFall.connect(retreatGain);
      retreatGain.connect(gain);

      breakingNoise.chain(
        breakingFilter,
        breakingGain,
        gain
      );

      foamNoise.chain(
        foamFilter,
        foamGain,
        gain
      );

      splashNoise.chain(
        splashFilter,
        splashGain,
        gain
      );

      // Start all individual components at absolute zero, then fade in very slowly
      setTimeout(() => {
        // First, unmute all noise sources gradually
        deepOcean.volume.rampTo(-20, 0.5);
        brownNoise.volume.rampTo(-15, 0.5);
        pinkNoise.volume.rampTo(-10, 0.5);
        waveRetreat.volume.rampTo(-15, 0.5);
        breakingNoise.volume.rampTo(-12, 0.5);
        foamNoise.volume.rampTo(-18, 0.5);
        splashNoise.volume.rampTo(-20, 0.5);
        
        // Then fade in individual gains with higher values
        deepGain.gain.rampTo(0.15, 2.5);
        retreatGain.gain.rampTo(0.08, 2.8);
        breakingGain.gain.rampTo(0.12, 3.0);
        foamGain.gain.rampTo(0.06, 3.2);
        splashGain.gain.rampTo(0.04, 3.4);
        
        // Finally, fade in master gain with higher volume
        masterGain.gain.rampTo(volume * 0.3, 3.0);
      }, 200);

      return {
        masterGain,
        deepOcean,
        deepFilter,
        deepGain,
        pinkNoise,
        pinkHighpass,
        pinkLowpass,
        brownNoise,
        brownFilter,
        waveRetreat,
        retreatFilterRise,
        retreatFilterFall,
        retreatGain,
        washCycleLFO,
        washFrequencyLFO,
        breakingNoise,
        breakingFilter,
        breakingGain,
        breakingLFO,
        foamNoise,
        foamFilter,
        foamGain,
        foamLFO,
        splashNoise,
        splashFilter,
        splashGain,
        primaryWaveLFO,
        secondaryWaveLFO,
        randomModulation,
        gain,
        reverb,
      };
    },
  },
];

// -------------------------
// Tipado de contexto
// -------------------------
interface Sound {
  key: string;
  label: string;
  icon: string;
  volume: number;
  isPlaying: boolean;
  soundRef: Record<string, any> | null;
  min?: number;
  max?: number;
  defaultVolume?: number;
  volumeMultiplier?: number;
  create?: (volume: number) => Record<string, any>;
}

interface NoiseContextType {
  sounds: Sound[];
  startSound: (index: number) => Promise<void>;
  stopSound: (index: number) => void;
  setVolume: (index: number, volume: number) => void;
  toggleAllSounds: () => void;
  isInitialized: boolean;
  initializeAudio: () => Promise<boolean>;
}

// -------------------------
// Context
// -------------------------
const NoiseContext = createContext<NoiseContextType | undefined>(undefined);

export function NoiseProvider({ children }: { children: ReactNode }) {
  const masterGainRef = useRef<Tone.Gain | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sounds, setSounds] = useState<Sound[]>(
    SOUND_CONFIGS.map((config) => ({
      ...config,
      volume: parseFloat(
        localStorage.getItem(config.key + "Volume") || `${config.defaultVolume}`
      ),
      isPlaying: localStorage.getItem(config.key + "IsPlaying") === "true",
      soundRef: null,
    }))
  );

  const soundsRef = useRef(sounds);
  useEffect(() => {
    soundsRef.current = sounds;
  }, [sounds]);

  // -------------------------
  // Inicializar audio
  // -------------------------
  const initializeAudio = async (): Promise<boolean> => {
    if (isInitialized) return true;
    
    try {
      // Check if Tone.js context exists and create if needed
      if (!Tone.context) {
        await Tone.start();
      }
      
      // Handle different browser audio context states
      const context = Tone.context;
      if (context.state === 'suspended' || context.state === 'interrupted') {
        // Try to resume the context
        await context.resume();
        // Wait for the context to actually start
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Final check - if still not running, we'll need user interaction
      if (context.state !== 'running') {
        console.warn('Audio context requires user interaction to start');
        return false;
      }
      
      // Crear el nodo de ganancia maestro
      if (!masterGainRef.current) {
        masterGainRef.current = new Tone.Gain(1).toDestination();
        masterGainRef.current.gain.value = 1;
      }
      
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.warn("Audio initialization requires user interaction:", error);
      return false;
    }
  };

  // Add global user interaction listener to initialize audio
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (!isInitialized) {
        await initializeAudio();
      }
    };

    // Add event listeners for user interaction
    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [isInitialized]);

  // -------------------------
  // Start / Stop / Volume
  // -------------------------
  const startSound = async (index: number) => {
    const sound = sounds[index];
    if (!sound) return;
    
    // Inicializar audio si no está inicializado
    const audioInitialized = await initializeAudio();
    if (!audioInitialized) {
      console.warn('Audio could not be initialized');
      return;
    }

    // Asegurarse de que el contexto de audio esté en ejecución
    if (Tone.context.state === 'suspended' || Tone.context.state === 'interrupted') {
      await Tone.context.resume();
    }

    // Crear el nodo de ganancia maestro si no existe
    if (!masterGainRef.current) {
      masterGainRef.current = new Tone.Gain(1).toDestination();
      masterGainRef.current.gain.value = 1;
    }

    // Crear el sonido si no existe
    if (!sound.soundRef && sound.create) {
      try {
        sound.soundRef = sound.create(sound.volume);
      } catch (error) {
        console.error('Error creating sound:', error);
        return;
      }
    }

    setSounds((prev) => {
      const newSounds = [...prev];
      const currentSound = newSounds[index];
      if (currentSound) {
        newSounds[index] = { ...currentSound, isPlaying: true };
      }
      return newSounds;
    });

    localStorage.setItem(sound.key + "IsPlaying", "true");
  };

  const stopSound = (index: number) => {
    const sound = sounds[index];
    if (!sound) return;
    
    if (sound.soundRef) {
      Object.values(sound.soundRef).forEach((node: any) => {
        if (node && typeof node.dispose === 'function') {
          node.dispose();
        }
      });
      sound.soundRef = null;
    }
    
    setSounds((prev) => {
      const newSounds = [...prev];
      const currentSound = newSounds[index];
      if (currentSound) {
        newSounds[index] = { ...currentSound, isPlaying: false };
      }
      return newSounds;
    });
    
    localStorage.setItem(sound.key + "IsPlaying", "false");
  };

  const setVolume = async (index: number, volume: number): Promise<void> => {
    const sound = sounds[index];
    if (!sound) return;
    
    // Update volume state
    setSounds((prev) => {
      const newSounds = [...prev];
      const currentSound = newSounds[index];
      if (currentSound) {
        newSounds[index] = { ...currentSound, volume };
      }
      return newSounds;
    });
    
    localStorage.setItem(sound.key + "Volume", volume.toString());

    // Make sure the sound is playing if it's not
    if (!sound.isPlaying) {
      await startSound(index);
    }

    // Update volume in the gain node
    const soundRef = sound.soundRef as any;
    if (!soundRef) return;

    // For ocean sound, update master gain and all components with proper balancing
    if (sound.key === 'ocean' && soundRef) {
      const isMuted = volume === 0;
      const baseVolume = isMuted ? 0 : Math.max(volume, 0.0001) * (sound.volumeMultiplier || 1);
      
      // Mute all components if volume is 0
      if (isMuted) {
        // Master gain - immediate mute
        soundRef.masterGain?.gain.cancelScheduledValues(0);
        soundRef.masterGain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        // Main gain - immediate mute
        soundRef.gain?.gain.cancelScheduledValues(0);
        soundRef.gain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        // Individual components - set to 0 immediately for instant mute
        soundRef.deepGain?.gain.cancelScheduledValues(0);
        soundRef.deepGain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        soundRef.breakingGain?.gain.cancelScheduledValues(0);
        soundRef.breakingGain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        soundRef.splashGain?.gain.cancelScheduledValues(0);
        soundRef.splashGain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        soundRef.foamGain?.gain.cancelScheduledValues(0);
        soundRef.foamGain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        soundRef.retreatGain?.gain.cancelScheduledValues(0);
        soundRef.retreatGain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        // Mute all noise sources completely
        soundRef.deepOcean?.volume?.cancelScheduledValues(0);
        soundRef.deepOcean?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
        
        soundRef.brownNoise?.volume?.cancelScheduledValues(0);
        soundRef.brownNoise?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
        
        soundRef.pinkNoise?.volume?.cancelScheduledValues(0);
        soundRef.pinkNoise?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
        
        soundRef.breakingNoise?.volume?.cancelScheduledValues(0);
        soundRef.breakingNoise?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
        
        soundRef.foamNoise?.volume?.cancelScheduledValues(0);
        soundRef.foamNoise?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
        
        soundRef.splashNoise?.volume?.cancelScheduledValues(0);
        soundRef.splashNoise?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
        
        soundRef.waveRetreat?.volume?.cancelScheduledValues(0);
        soundRef.waveRetreat?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
      } else {
        // Update volumes when not muted - use master gain for smooth control
        soundRef.masterGain?.gain.rampTo(baseVolume, 0.1);
        
        // Individual components with proper balancing - updated for audible volume
        if (soundRef.deepGain) {
          soundRef.deepGain.gain.rampTo(0.15 * baseVolume, 0.1);
        }
        
        if (soundRef.breakingGain) {
          soundRef.breakingGain.gain.rampTo(0.12 * baseVolume, 0.1);
        }
        
        if (soundRef.splashGain) {
          soundRef.splashGain.gain.rampTo(0.04 * baseVolume, 0.1);
        }
        
        if (soundRef.foamGain) {
          soundRef.foamGain.gain.rampTo(0.06 * baseVolume, 0.1);
        }
        
        if (soundRef.retreatGain) {
          soundRef.retreatGain.gain.rampTo(0.08 * baseVolume, 0.1);
        }
        
        // Unmute all noise sources
        if (soundRef.deepOcean?.volume) {
          soundRef.deepOcean.volume.rampTo(-20 + (20 * Math.log10(baseVolume)), 0.1);
        }
        
        if (soundRef.brownNoise?.volume) {
          soundRef.brownNoise.volume.rampTo(-15 + (20 * Math.log10(baseVolume)), 0.1);
        }
        
        if (soundRef.pinkNoise?.volume) {
          soundRef.pinkNoise.volume.rampTo(-10 + (20 * Math.log10(baseVolume)), 0.1);
        }
        
        if (soundRef.breakingNoise?.volume) {
          soundRef.breakingNoise.volume.rampTo(-12 + (20 * Math.log10(baseVolume)), 0.1);
        }
        
        if (soundRef.foamNoise?.volume) {
          soundRef.foamNoise.volume.rampTo(-18 + (20 * Math.log10(baseVolume)), 0.1);
        }
        
        if (soundRef.splashNoise?.volume) {
          soundRef.splashNoise.volume.rampTo(-20 + (20 * Math.log10(baseVolume)), 0.1);
        }
        
        if (soundRef.waveRetreat?.volume) {
          soundRef.waveRetreat.volume.rampTo(-15 + (20 * Math.log10(baseVolume)), 0.1);
        }
      }
    }
    // For rain sound, update both main gain and background gain
    else if (sound.key === 'rain' && soundRef) {
      const isMuted = volume === 0;
      const baseVolume = isMuted ? 0 : Math.max(volume, 0.0001) * (sound.volumeMultiplier || 1);
      
      if (isMuted) {
        // Mute all rain components
        soundRef.gain?.gain.rampTo(0, 0.1);
        soundRef.backgroundGain?.gain.rampTo(0, 0.1);
      } else {
        // Update rain volumes
        soundRef.gain?.gain.rampTo(baseVolume, 0.1);
        soundRef.backgroundGain?.gain.rampTo(baseVolume * 0.3, 0.1);
      }
    }
    else if (soundRef?.gain) {
      const safeVolume = volume === 0 
        ? 0.0001 * (sound.volumeMultiplier || 1)
        : Math.max(volume, 0.0001) * (sound.volumeMultiplier || 1);
      
      soundRef.gain.gain.value = safeVolume;
    }
  };

  const toggleAllSounds = async () => {
    const allPlaying = sounds.every((s) => s.isPlaying);
    if (allPlaying) sounds.forEach((_, i) => stopSound(i));
    else await Promise.all(sounds.map((s, i) => !s.isPlaying && startSound(i)));
  };

  // -------------------------
  // Cleanup
  // -------------------------
  useEffect(() => {
    return () => {
      soundsRef.current.forEach((sound) => {
        if (sound.soundRef)
          Object.values(sound.soundRef).forEach((node) => node.dispose?.());
      });
      masterGainRef.current?.dispose();
    };
  }, []);

  return (
    <NoiseContext.Provider
      value={{
        sounds,
        startSound,
        stopSound,
        setVolume,
        toggleAllSounds,
        isInitialized,
        initializeAudio,
      }}
    >
      {children}
    </NoiseContext.Provider>
  );
}

// -------------------------
// Hook
// -------------------------
export function useNoise() {
  const context = useContext(NoiseContext);
  if (!context) throw new Error("useNoise must be used within a NoiseProvider");
  return context;
}
