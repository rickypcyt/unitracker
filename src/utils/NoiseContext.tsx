import * as Tone from "tone";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
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
      const noise = new Tone.Noise("brown").start();
      const filter = new Tone.Filter(200, "lowpass");
      const limiter = new Tone.Limiter(-3).toDestination();
      const gain = new Tone.Gain(volume);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(limiter);
      return { noise, filter, gain, limiter };
    },
  },
  {
    key: "rain",
    label: "Rain Sound",
    icon: "CloudRain",
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 0.2,
    create: (volume: number) => {
      const noise = new Tone.Noise("pink").start();
      const highpass = new Tone.Filter(200, "highpass");
      const lowpass = new Tone.Filter(1500, "lowpass");
      const ambientNoise = new Tone.Noise("brown").start();
      const ambientFilter = new Tone.Filter(100, "lowpass");
      const ambientGain = new Tone.Gain(0.2);
      const reverb = new Tone.Reverb({
        decay: 2,
        wet: 0.2,
        preDelay: 0.1,
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
    defaultVolume: 1,
    volumeMultiplier: 0.2,
    create: (volume: number) => {
      // Main ocean waves (low frequency rumble)
      const brownNoise = new Tone.Noise("brown").start();
      const brownFilter = new Tone.Filter(120, "lowpass");
      brownFilter.frequency.value = 120;
      brownFilter.Q.value = 0.5;
      
      // Ocean surface (mid frequencies)
      const pinkNoise = new Tone.Noise("pink").start();
      const pinkHighpass = new Tone.Filter(100, "highpass");
      const pinkLowpass = new Tone.Filter(1000, "lowpass");
      pinkHighpass.frequency.value = 100;
      pinkLowpass.frequency.value = 1000;
      pinkLowpass.Q.value = 0.7;
      
      // Wave LFO for natural volume fluctuations
      const waveLFO = new Tone.LFO(0.08, 0.4, 0.8).start();
      const randomLFO = new Tone.LFO(0.03, 0.05, 0.1).start();
      randomLFO.connect(waveLFO.frequency);

      // Breaking waves (mid-high frequencies)
      const breakingNoise = new Tone.Noise("pink").start();
      const breakingFilter = new Tone.Filter({
        type: "bandpass",
        frequency: 600,
        Q: 1.2,
        gain: 0
      });
      const breakingGain = new Tone.Gain(0.1);

      // Water splashes (high frequencies)
      const splashNoise = new Tone.Noise("white").start();
      const splashFilter = new Tone.Filter({
        type: "bandpass",
        frequency: 2500,
        Q: 0.8,
        gain: 0
      });
      const splashGain = new Tone.Gain(0.05);

      // Reverb for spatial depth
      const reverb = new Tone.Reverb({
        decay: 5,
        wet: 0.3,
        preDelay: 0.1,
      }).toDestination();
      
      // Main gain with volume control
      const gain = new Tone.Gain(volume * 0.2).connect(reverb);
      waveLFO.connect(gain.gain);

      // Connect all noise sources with their respective filters and gains
      brownNoise.connect(brownFilter).connect(gain);
      
      pinkNoise.chain(
        pinkHighpass,
        pinkLowpass,
        gain
      );

      breakingNoise.chain(
        breakingFilter,
        breakingGain,
        gain
      );

      splashNoise.chain(
        splashFilter,
        splashGain,
        gain
      );

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
    if (isInitialized || Tone.context.state === 'running') return true;
    
    try {
      // Intentar iniciar el contexto de audio
      await Tone.start();
      
      // Verificar si el contexto de audio está realmente funcionando
      if (Tone.context.state === 'suspended' || Tone.context.state === 'interrupted') {
        await Tone.context.resume();
        // Esperar un momento para que el contexto se actualice
        await new Promise(resolve => setTimeout(resolve, 100));
        // Type assertion to handle Web Audio API state that TypeScript doesn't know about
        if ((Tone.context.state as string) !== 'running') {
          throw new Error('Audio context could not be started');
        }
      }
      
      // Crear el nodo de ganancia maestro
      if (!masterGainRef.current) {
        masterGainRef.current = new Tone.Gain(1).toDestination();
        masterGainRef.current.gain.value = 1;
      }
      
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error("Error initializing Tone.js:", error);
      // Mostrar un mensaje al usuario si es necesario
      return false;
    }
  };

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

    // For ocean sound, we need to update multiple gain nodes with proper balancing
    if (sound.key === 'ocean' && soundRef) {
      const isMuted = volume === 0;
      const baseVolume = isMuted ? 0 : Math.max(volume, 0.0001) * (sound.volumeMultiplier || 1);
      
      // Mute all components if volume is 0
      if (isMuted) {
        // Main gain
        soundRef.gain?.gain.rampTo(0, 0.1);
        
        // Individual components - set to 0 immediately for instant mute
        soundRef.breakingGain?.gain.cancelScheduledValues(0);
        soundRef.breakingGain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        soundRef.splashGain?.gain.cancelScheduledValues(0);
        soundRef.splashGain?.gain.setValueAtTime(0, Tone.context.currentTime);
        
        soundRef.brownFilter?.gain?.cancelScheduledValues(0);
        soundRef.brownFilter?.gain?.setValueAtTime(0, Tone.context.currentTime);
        
        soundRef.pinkNoise?.volume?.cancelScheduledValues(0);
        soundRef.pinkNoise?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
        
        soundRef.brownNoise?.volume?.cancelScheduledValues(0);
        soundRef.brownNoise?.volume?.setValueAtTime(-Infinity, Tone.context.currentTime);
      } else {
        // Update volumes when not muted
        // Main gain
        soundRef.gain?.gain.rampTo(baseVolume, 0.1);
        
        // Individual components with proper balancing
        if (soundRef.breakingGain) {
          soundRef.breakingGain.gain.rampTo(0.2 * baseVolume * 0.8, 0.1);
        }
        
        if (soundRef.splashGain) {
          soundRef.splashGain.gain.rampTo(0.15 * baseVolume * 0.6, 0.1);
        }
        
        if (soundRef.brownFilter?.gain) {
          soundRef.brownFilter.gain.rampTo(0.5 * baseVolume * 0.7, 0.1);
        }
        
        // Ensure noise sources are unmuted
        soundRef.pinkNoise?.volume?.rampTo(0, 0.1);
        soundRef.brownNoise?.volume?.rampTo(0, 0.1);
      }
    } 
    // For other sounds, just update the main gain
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
