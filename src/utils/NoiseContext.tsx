import * as Tone from "tone";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ==================== TYPES ====================
interface SoundNode {
  dispose: () => void;
  setVolume: (volume: number) => void;
}

interface SoundConfig {
  key: string;
  label: string;
  icon: string;
  min: number;
  max: number;
  defaultVolume: number;
  volumeMultiplier: number;
  create: (volume: number) => SoundNode;
}

interface Sound {
  key: string;
  label: string;
  icon: string;
  volume: number;
  isPlaying: boolean;
  min: number;
  max: number;
  defaultVolume: number;
}

interface NoiseContextType {
  sounds: Sound[];
  startSound: (index: number) => Promise<void>;
  stopSound: (index: number) => void;
  setVolume: (index: number, volume: number) => Promise<void>;
  toggleAllSounds: () => Promise<void>;
  isInitialized: boolean;
}

// ==================== AUDIO ENGINE ====================
class AudioEngine {
  private static instance: AudioEngine;
  private masterGain: Tone.Gain | null = null;
  private initialized = false;

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      if (!Tone.context || Tone.context.state !== "running") {
        await Tone.start();
        await Tone.context.resume();
      }

      if (Tone.context.state !== "running") {
        return false;
      }

      if (!this.masterGain) {
        this.masterGain = new Tone.Gain(1).toDestination();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Audio initialization failed:", error);
      return false;
    }
  }

  isReady(): boolean {
    return this.initialized && Tone.context?.state === "running";
  }

  dispose(): void {
    this.masterGain?.dispose();
    this.masterGain = null;
    this.initialized = false;
  }
}

// ==================== SOUND NODES ====================
abstract class BaseSoundNode implements SoundNode {
  protected nodes: Tone.ToneAudioNode[] = [];
  protected volume: number;

  constructor(volume: number) {
    this.volume = volume;
  }

  abstract setVolume(volume: number): void;

  dispose(): void {
    this.nodes.forEach((node) => {
      try {
        node.dispose();
      } catch (e) {
        console.warn("Error disposing node:", e);
      }
    });
    this.nodes = [];
  }

  protected registerNode(node: Tone.ToneAudioNode): void {
    this.nodes.push(node);
  }

  protected setGainWithRamp(
    gain: Tone.Gain,
    value: number,
    rampTime: number = 0.1
  ): void {
    gain.gain.rampTo(value, rampTime);
  }
}

class BrownNoiseNode extends BaseSoundNode {
  private deepGain: Tone.Gain;
  private mainGain: Tone.Gain;
  private midGain: Tone.Gain;
  private highGain: Tone.Gain;
  private outputGain: Tone.Gain;

  constructor(volume: number) {
    super(volume);

    const deepBrown = new Tone.Noise("brown").start();
    const deepFilter = new Tone.Filter(60, "lowpass", -24);
    deepFilter.Q.value = 0.2;
    this.deepGain = new Tone.Gain(0.3);

    const mainBrown = new Tone.Noise("brown").start();
    const mainFilter = new Tone.Filter(180, "lowpass", -12);
    mainFilter.Q.value = 0.3;
    this.mainGain = new Tone.Gain(0.5);

    const midBrown = new Tone.Noise("brown").start();
    const midFilter = new Tone.Filter(300, "bandpass", -12);
    midFilter.Q.value = 0.5;
    this.midGain = new Tone.Gain(0.15);

    const highTexture = new Tone.Noise("pink").start();
    const highFilter = new Tone.Filter(1000, "highpass", -24);
    highFilter.Q.value = 0.3;
    this.highGain = new Tone.Gain(0.02);

    const slowLFO = new Tone.LFO(0.015, 0.9, 1.1).start();
    const mediumLFO = new Tone.LFO(0.03, 0.95, 1.05).start();
    const highLFO = new Tone.LFO(0.08, 0.01, 0.03).start();

    slowLFO.connect(this.deepGain.gain);
    mediumLFO.connect(this.mainGain.gain);
    highLFO.connect(this.highGain.gain);

    const smoothingFilter = new Tone.Filter(500, "lowpass", -12);
    smoothingFilter.Q.value = 0.2;

    const compressor = new Tone.Compressor({
      threshold: -18,
      ratio: 2,
      attack: 0.01,
      release: 0.5,
      knee: 6,
    });

    const limiter = new Tone.Limiter(-6).toDestination();

    this.outputGain = new Tone.Gain(volume * 0.4)
      .connect(smoothingFilter)
      .connect(compressor)
      .connect(limiter);

    deepBrown.chain(deepFilter, this.deepGain, this.outputGain);
    mainBrown.chain(mainFilter, this.mainGain, this.outputGain);
    midBrown.chain(midFilter, this.midGain, this.outputGain);
    highTexture.chain(highFilter, this.highGain, this.outputGain);

    [
      deepBrown,
      deepFilter,
      this.deepGain,
      mainBrown,
      mainFilter,
      this.mainGain,
      midBrown,
      midFilter,
      this.midGain,
      highTexture,
      highFilter,
      this.highGain,
      highLFO,
      slowLFO,
      mediumLFO,
      smoothingFilter,
      compressor,
      this.outputGain,
      limiter,
    ].forEach((node) => this.registerNode(node));
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.setGainWithRamp(this.outputGain, volume * 0.4);
  }
}

class RainSoundNode extends BaseSoundNode {
  private mainGain: Tone.Gain;
  private backgroundGain: Tone.Gain;

  constructor(volume: number) {
    super(volume);

    const noise = new Tone.Noise("white").start();
    const filter = new Tone.Filter(2000, "bandpass");
    filter.Q.value = 1.2;

    const envelope = new Tone.AmplitudeEnvelope({
      attack: 0.01,
      decay: 0.08,
      sustain: 0,
      release: 0.03,
    });

    const reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.3,
      preDelay: 0.01,
    }).toDestination();

    this.mainGain = new Tone.Gain(volume * 0.8).connect(reverb);

    noise.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.mainGain);

    const scheduleRainDrops = (time: number): void => {
      const interval = Math.random() * 0.25 + 0.05;
      envelope.triggerAttackRelease(0.1, time);

      const nextDropTime = time + interval;
      if (nextDropTime < Tone.now() + 60) {
        Tone.Transport.schedule(scheduleRainDrops, nextDropTime);
      }
    };

    Tone.Transport.schedule(scheduleRainDrops, Tone.now());

    const backgroundRain = new Tone.Noise("pink").start();
    const backgroundFilter = new Tone.Filter(800, "lowpass");
    backgroundFilter.Q.value = 0.4;
    this.backgroundGain = new Tone.Gain(volume * 0.3);

    backgroundRain.connect(backgroundFilter);
    backgroundFilter.connect(this.backgroundGain);
    this.backgroundGain.connect(reverb);

    [
      noise,
      filter,
      envelope,
      backgroundRain,
      backgroundFilter,
      this.backgroundGain,
      this.mainGain,
      reverb,
    ].forEach((node) => this.registerNode(node));
  }

  setVolume(volume: number): void {
    this.volume = volume;
    const isMuted = volume === 0;

    if (isMuted) {
      this.setGainWithRamp(this.mainGain, 0);
      this.setGainWithRamp(this.backgroundGain, 0);
    } else {
      this.setGainWithRamp(this.mainGain, volume * 0.8);
      this.setGainWithRamp(this.backgroundGain, volume * 0.3);
    }
  }
}

class OceanWavesNode extends BaseSoundNode {
  private masterGain: Tone.Gain;
  private outputGain: Tone.Gain;
  private componentGains: Map<string, Tone.Gain> = new Map();
  private noiseSources: Map<string, Tone.Noise> = new Map();

  constructor(volume: number) {
    super(volume);

    this.masterGain = new Tone.Gain(0).toDestination();
    const reverb = new Tone.Reverb({
      decay: 8,
      wet: 0.4,
      preDelay: 0.15,
    }).connect(this.masterGain);

    this.outputGain = new Tone.Gain(0).connect(reverb);

    // Create wave modulation LFOs
    const primaryWaveLFO = new Tone.LFO(0.06, 0.5, 0.9).start();
    const secondaryWaveLFO = new Tone.LFO(0.12, 0.3, 0.7).start();
    const randomModulation = new Tone.LFO(0.04, 0.02, 0.08).start();
    
    randomModulation.connect(primaryWaveLFO.frequency);
    randomModulation.connect(secondaryWaveLFO.frequency);
    primaryWaveLFO.connect(this.outputGain.gain);
    secondaryWaveLFO.connect(this.outputGain.gain);

    this.createDeepOcean(this.outputGain);
    this.createMainWaves(this.outputGain);
    this.createSurface(this.outputGain);
    this.createWaveRetreat(this.outputGain);
    this.createBreakingWaves(this.outputGain);
    this.createFoam(this.outputGain);
    this.createSplashes(this.outputGain);

    this.registerNode(this.masterGain);
    this.registerNode(reverb);
    this.registerNode(this.outputGain);
    this.registerNode(primaryWaveLFO);
    this.registerNode(secondaryWaveLFO);
    this.registerNode(randomModulation);

    this.fadeIn(volume);
  }

  private createDeepOcean(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("brown").start();
    noise.volume.value = -Infinity;
    const filter = new Tone.Filter(80, "lowpass");
    filter.Q.value = 0.3;
    const gain = new Tone.Gain(0);

    noise.chain(filter, gain, outputGain);

    this.noiseSources.set("deep", noise);
    this.componentGains.set("deep", gain);
    [noise, filter, gain].forEach((n) => this.registerNode(n));
  }

  private createMainWaves(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("brown").start();
    noise.volume.value = -Infinity;
    const filter = new Tone.Filter(150, "lowpass");
    filter.Q.value = 0.6;
    const gain = new Tone.Gain(0);

    noise.chain(filter, gain, outputGain);

    this.noiseSources.set("main", noise);
    this.componentGains.set("main", gain);
    [noise, filter, gain].forEach((n) => this.registerNode(n));
  }

  private createSurface(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("pink").start();
    noise.volume.value = -Infinity;
    const highpass = new Tone.Filter(80, "highpass");
    const lowpass = new Tone.Filter(1200, "lowpass");
    lowpass.Q.value = 0.8;
    const gain = new Tone.Gain(0);

    noise.chain(highpass, lowpass, gain, outputGain);

    this.noiseSources.set("surface", noise);
    this.componentGains.set("surface", gain);
    [noise, highpass, lowpass, gain].forEach((n) => this.registerNode(n));
  }

  private createWaveRetreat(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("pink").start();
    noise.volume.value = -Infinity;
    const filter = new Tone.Filter(600, "bandpass");
    filter.Q.value = 2.0;
    const gain = new Tone.Gain(0);

    const washCycleLFO = new Tone.LFO(0.08, 0, 1).start();
    const washFrequencyLFO = new Tone.LFO(0.08, 300, 800).start();
    
    washCycleLFO.connect(gain.gain);
    washFrequencyLFO.connect(filter.frequency);

    noise.chain(filter, gain, outputGain);

    this.noiseSources.set("retreat", noise);
    this.componentGains.set("retreat", gain);
    [noise, filter, gain, washCycleLFO, washFrequencyLFO].forEach((n) => this.registerNode(n));
  }

  private createBreakingWaves(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("pink").start();
    noise.volume.value = -Infinity;
    const filter = new Tone.Filter(800, "bandpass");
    filter.Q.value = 1.5;
    const gain = new Tone.Gain(0);

    const lfo = new Tone.LFO(0.15, 0.05, 0.2).start();
    lfo.connect(gain.gain);

    noise.chain(filter, gain, outputGain);

    this.noiseSources.set("breaking", noise);
    this.componentGains.set("breaking", gain);
    [noise, filter, gain, lfo].forEach((n) => this.registerNode(n));
  }

  private createFoam(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("white").start();
    noise.volume.value = -Infinity;
    const filter = new Tone.Filter(3000, "highpass");
    filter.Q.value = 0.5;
    const gain = new Tone.Gain(0);

    const lfo = new Tone.LFO(0.25, 0.02, 0.1).start();
    lfo.connect(gain.gain);

    noise.chain(filter, gain, outputGain);

    this.noiseSources.set("foam", noise);
    this.componentGains.set("foam", gain);
    [noise, filter, gain, lfo].forEach((n) => this.registerNode(n));
  }

  private createSplashes(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("white").start();
    noise.volume.value = -Infinity;
    const filter = new Tone.Filter(4000, "bandpass");
    filter.Q.value = 1.0;
    const gain = new Tone.Gain(0);

    noise.chain(filter, gain, outputGain);

    this.noiseSources.set("splash", noise);
    this.componentGains.set("splash", gain);
    [noise, filter, gain].forEach((n) => this.registerNode(n));
  }

  private fadeIn(volume: number): void {
    setTimeout(() => {
      // Fade in noise sources
      this.noiseSources.get("deep")?.volume.rampTo(-20, 0.5);
      this.noiseSources.get("main")?.volume.rampTo(-15, 0.5);
      this.noiseSources.get("surface")?.volume.rampTo(-10, 0.5);
      this.noiseSources.get("retreat")?.volume.rampTo(-15, 0.5);
      this.noiseSources.get("breaking")?.volume.rampTo(-12, 0.5);
      this.noiseSources.get("foam")?.volume.rampTo(-18, 0.5);
      this.noiseSources.get("splash")?.volume.rampTo(-20, 0.5);

      // Fade in component gains
      this.componentGains.get("deep")?.gain.rampTo(0.15, 2.5);
      this.componentGains.get("main")?.gain.rampTo(0.5, 2.5);
      this.componentGains.get("surface")?.gain.rampTo(0.3, 2.5);
      this.componentGains.get("retreat")?.gain.rampTo(0.08, 2.8);
      this.componentGains.get("breaking")?.gain.rampTo(0.12, 3.0);
      this.componentGains.get("foam")?.gain.rampTo(0.06, 3.2);
      this.componentGains.get("splash")?.gain.rampTo(0.04, 3.4);

      // Fade in output and master gains
      this.outputGain.gain.rampTo(0.5, 2.5);
      this.masterGain.gain.rampTo(volume * 0.3, 3.0);
    }, 200);
  }

  setVolume(volume: number): void {
    this.volume = volume;
    const isMuted = volume === 0;
    const baseVolume = isMuted ? 0 : Math.max(volume, 0.0001) * 0.3;

    if (isMuted) {
      this.masterGain.gain.cancelScheduledValues(0);
      this.masterGain.gain.setValueAtTime(0, Tone.context.currentTime);
      
      this.outputGain.gain.cancelScheduledValues(0);
      this.outputGain.gain.setValueAtTime(0, Tone.context.currentTime);

      this.componentGains.forEach((gain) => {
        gain.gain.cancelScheduledValues(0);
        gain.gain.setValueAtTime(0, Tone.context.currentTime);
      });

      this.noiseSources.forEach((noise) => {
        noise.volume.cancelScheduledValues(0);
        noise.volume.setValueAtTime(-Infinity, Tone.context.currentTime);
      });
    } else {
      this.setGainWithRamp(this.masterGain, baseVolume);
      this.setGainWithRamp(this.outputGain, 0.5);

      // Set component gains with proper ratios
      this.componentGains.get("deep")?.gain.rampTo(0.15, 0.1);
      this.componentGains.get("main")?.gain.rampTo(0.5, 0.1);
      this.componentGains.get("surface")?.gain.rampTo(0.3, 0.1);
      this.componentGains.get("retreat")?.gain.rampTo(0.08, 0.1);
      this.componentGains.get("breaking")?.gain.rampTo(0.12, 0.1);
      this.componentGains.get("foam")?.gain.rampTo(0.06, 0.1);
      this.componentGains.get("splash")?.gain.rampTo(0.04, 0.1);

      // Set noise source volumes
      this.noiseSources.get("deep")?.volume.rampTo(-20, 0.1);
      this.noiseSources.get("main")?.volume.rampTo(-15, 0.1);
      this.noiseSources.get("surface")?.volume.rampTo(-10, 0.1);
      this.noiseSources.get("retreat")?.volume.rampTo(-15, 0.1);
      this.noiseSources.get("breaking")?.volume.rampTo(-12, 0.1);
      this.noiseSources.get("foam")?.volume.rampTo(-18, 0.1);
      this.noiseSources.get("splash")?.volume.rampTo(-20, 0.1);
    }
  }
}

// ==================== SOUND CONFIGURATIONS ====================
const SOUND_CONFIGS: SoundConfig[] = [
  {
    key: "brown",
    label: "Brown Noise",
    icon: "Cloud",
    min: 0,
    max: 3,
    defaultVolume: 1.5,
    volumeMultiplier: 0.5,
    create: (volume: number) => new BrownNoiseNode(volume),
  },
  {
    key: "rain",
    label: "Rain Sound",
    icon: "CloudRain",
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 1.0,
    create: (volume: number) => new RainSoundNode(volume),
  },
  {
    key: "ocean",
    label: "Ocean Waves",
    icon: "Waves",
    min: 0,
    max: 3,
    defaultVolume: 0.8,
    volumeMultiplier: 0.3,
    create: (volume: number) => new OceanWavesNode(volume),
  },
];

// ==================== STORAGE ====================
class SoundStorage {
  static getVolume(key: string, defaultValue: number): number {
    const stored = localStorage.getItem(`${key}Volume`);
    return stored ? parseFloat(stored) : defaultValue;
  }

  static setVolume(key: string, volume: number): void {
    localStorage.setItem(`${key}Volume`, volume.toString());
  }

  static getIsPlaying(key: string): boolean {
    return localStorage.getItem(`${key}IsPlaying`) === "true";
  }

  static setIsPlaying(key: string, isPlaying: boolean): void {
    localStorage.setItem(`${key}IsPlaying`, isPlaying.toString());
  }
}

// ==================== CONTEXT ====================
const NoiseContext = createContext<NoiseContextType | undefined>(undefined);

export function NoiseProvider({ children }: { children: ReactNode }) {
  const audioEngine = useRef(AudioEngine.getInstance());
  const soundNodes = useRef<Map<string, SoundNode>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  const [sounds, setSounds] = useState<Sound[]>(() =>
    SOUND_CONFIGS.map((config) => ({
      key: config.key,
      label: config.label,
      icon: config.icon,
      min: config.min,
      max: config.max,
      defaultVolume: config.defaultVolume,
      volume: SoundStorage.getVolume(config.key, config.defaultVolume),
      isPlaying: SoundStorage.getIsPlaying(config.key),
    }))
  );

  const initializeAudio = useCallback(async (): Promise<boolean> => {
    if (isInitialized) return true;
    const success = await audioEngine.current.initialize();
    if (success) setIsInitialized(true);
    return success;
  }, [isInitialized]);

  useEffect(() => {
    const handleUserInteraction = () => {
      if (!isInitialized) initializeAudio();
    };

    const events = ["click", "keydown", "touchstart"];
    events.forEach((event) =>
      document.addEventListener(event, handleUserInteraction, { once: true })
    );

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleUserInteraction)
      );
    };
  }, [isInitialized, initializeAudio]);

  const startSound = useCallback(
    async (index: number): Promise<void> => {
      const sound = sounds[index];
      if (!sound) return;

      const initialized = await initializeAudio();
      if (!initialized || !audioEngine.current.isReady()) return;

      const config = SOUND_CONFIGS[index];
      if (!soundNodes.current.has(sound.key) && config) {
        const node = config.create(sound.volume * config.volumeMultiplier);
        soundNodes.current.set(sound.key, node);
      }

      setSounds((prev) =>
        prev.map((s, i) => (i === index ? { ...s, isPlaying: true } : s))
      );

      SoundStorage.setIsPlaying(sound.key, true);
    },
    [sounds, initializeAudio]
  );

  const stopSound = useCallback(
    (index: number): void => {
      const sound = sounds[index];
      if (!sound) return;

      const node = soundNodes.current.get(sound.key);
      if (node) {
        node.dispose();
        soundNodes.current.delete(sound.key);
      }

      setSounds((prev) =>
        prev.map((s, i) => (i === index ? { ...s, isPlaying: false } : s))
      );

      SoundStorage.setIsPlaying(sound.key, false);
    },
    [sounds]
  );

  const setVolume = useCallback(
    async (index: number, volume: number): Promise<void> => {
      const sound = sounds[index];
      if (!sound) return;

      setSounds((prev) =>
        prev.map((s, i) => (i === index ? { ...s, volume } : s))
      );

      SoundStorage.setVolume(sound.key, volume);

      if (!sound.isPlaying) {
        await startSound(index);
        return;
      }

      const node = soundNodes.current.get(sound.key);
      const config = SOUND_CONFIGS[index];
      if (node && config) {
        node.setVolume(volume * config.volumeMultiplier);
      }
    },
    [sounds, startSound]
  );

  const toggleAllSounds = useCallback(async (): Promise<void> => {
    const allPlaying = sounds.every((s) => s.isPlaying);

    if (allPlaying) {
      sounds.forEach((_, i) => stopSound(i));
    } else {
      await Promise.all(
        sounds.map((s, i) => (!s.isPlaying ? startSound(i) : Promise.resolve()))
      );
    }
  }, [sounds, startSound, stopSound]);

  useEffect(() => {
    return () => {
      soundNodes.current.forEach((node) => node.dispose());
      soundNodes.current.clear();
      audioEngine.current.dispose();
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
      }}
    >
      {children}
    </NoiseContext.Provider>
  );
}

export function useNoise() {
  const context = useContext(NoiseContext);
  if (!context) throw new Error("useNoise must be used within NoiseProvider");
  return context;
}