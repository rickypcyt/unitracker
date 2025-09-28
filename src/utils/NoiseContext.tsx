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
      const pinkNoise = new Tone.Noise("pink").start();
      const pinkHighpass = new Tone.Filter(200, "highpass");
      const pinkLowpass = new Tone.Filter(1200, "lowpass");
      const brownNoise = new Tone.Noise("brown").start();
      const brownFilter = new Tone.Filter(150, "lowpass");
      const waveLFO = new Tone.LFO(0.1, 0.3, 0.8).start();
      const randomLFO = new Tone.LFO(0.05, 0.08, 0.12).start();
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
        preDelay: 0.2,
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
  initializeAudio: () => Promise<void>;
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
  const initializeAudio = async () => {
    if (isInitialized) return;
    try {
      await Tone.start();
      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing Tone.js:", error);
    }
  };

  // -------------------------
  // Start / Stop / Volume
  // -------------------------
  const startSound = async (index: number) => {
    await initializeAudio();

    const sound = sounds[index];
    if (!masterGainRef.current)
      masterGainRef.current = new Tone.Gain(1).toDestination();

    if (!sound.soundRef && sound.create)
      sound.soundRef = sound.create(sound.volume);

    setSounds((prev) => {
      const newSounds = [...prev];
      newSounds[index] = { ...sound, isPlaying: true };
      return newSounds;
    });

    localStorage.setItem(sound.key + "IsPlaying", "true");
  };

  const stopSound = (index: number) => {
    const sound = sounds[index];
    if (sound.soundRef) {
      Object.values(sound.soundRef).forEach((node) => node.dispose?.());
      sound.soundRef = null;
    }
    setSounds((prev) => {
      const newSounds = [...prev];
      newSounds[index] = { ...sound, isPlaying: false };
      return newSounds;
    });
    localStorage.setItem(sound.key + "IsPlaying", "false");
  };

  const setVolume = (index: number, volume: number) => {
    const sound = sounds[index];
    setSounds((prev) => {
      const newSounds = [...prev];
      newSounds[index] = { ...sound, volume };
      return newSounds;
    });
    localStorage.setItem(sound.key + "Volume", volume.toString());

    if (sound.soundRef?.gain)
      sound.soundRef.gain.gain.value = volume * (sound.volumeMultiplier || 1);
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
