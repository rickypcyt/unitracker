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

interface SoundRef {
  filter?: { frequency: { value: number } };
  highpass?: { frequency: { value: number } };
  lowpass?: { frequency: { value: number } };
  reverb?: { wet: { value: number } };
  pinkHighpass?: { frequency: { value: number } };
  pinkLowpass?: { frequency: { value: number } };
  waveLFO?: { frequency: { value: number } };
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
  soundRef?: SoundRef | null;
}

interface NoiseContextType {
  sounds: Sound[];
  startSound: (index: number) => Promise<void>;
  stopSound: (index: number) => void;
  setVolume: (index: number, volume: number) => Promise<void>;
  setMaxVolume: (index: number, maxVolume: number) => void;
  toggleAllSounds: () => Promise<void>;
  isInitialized: boolean;
  initializeAudio: () => Promise<boolean>;
}

// ==================== AUDIO ENGINE ====================
class AudioEngine {
  private static instance: AudioEngine;
  private masterGain: Tone.Gain | null = null;
  private masterLimiter: Tone.Limiter | null = null;
  private reverbSend: Tone.Gain | null = null;
  private sharedReverb: Tone.Reverb | null = null;
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
      // Large output buffer — ambient noise doesn't need ~10ms latency, and
      // bigger render chunks survive CPU spikes that would otherwise underrun.
      // Must happen before any Tone.context access creates the default context.
      Tone.setContext(new Tone.Context({ latencyHint: "playback" }));

      if (!Tone.context || Tone.context.state !== "running") {
        let resolved = false;

        const attemptStart = async () => {
          try {
            await Tone.start();
            if (Tone.context.state !== "running") {
              await Tone.context.resume();
            }
            resolved = Tone.context.state === "running";
          } catch (error) {
            console.warn("Tone start/resume blocked:", error);
          }
        };

        await attemptStart();

        if (!resolved && (!Tone.context || Tone.context.state !== "running")) {
          await new Promise<void>((resolve) => {
            const resumeAudio = async () => {
              await attemptStart();
              document.removeEventListener("pointerup", resumeAudio);
              document.removeEventListener("keydown", resumeAudio);
              resolve();
            };

            document.addEventListener("pointerup", resumeAudio, { once: true });
            document.addEventListener("keydown", resumeAudio, { once: true });
          });
        }
      }

      if (Tone.context.state !== "running") {
        return false;
      }

      if (!this.masterGain) {
        // Single shared output chain: masterGain → limiter → destination.
        // The limiter prevents digital clipping when several sounds sum.
        this.masterLimiter = new Tone.Limiter(-1).toDestination();
        this.masterGain = new Tone.Gain(1).connect(this.masterLimiter);

        // One shared reverb bus: generating the impulse response is expensive,
        // so it happens once here instead of inside every sound start.
        this.reverbSend = new Tone.Gain(1);
        this.sharedReverb = new Tone.Reverb({ decay: 3, wet: 1 });
        this.reverbSend.connect(this.sharedReverb);
        this.sharedReverb.connect(this.masterLimiter);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Audio initialization failed:", error);
      return false;
    }
  }

  getMasterOut(): Tone.ToneAudioNode {
    if (!this.masterGain) throw new Error("AudioEngine is not initialized");
    return this.masterGain;
  }

  getReverbSend(): Tone.ToneAudioNode {
    if (!this.reverbSend) throw new Error("AudioEngine is not initialized");
    return this.reverbSend;
  }

  isReady(): boolean {
    return this.initialized && Tone.context?.state === "running";
  }

  dispose(): void {
    this.masterGain?.dispose();
    this.masterLimiter?.dispose();
    this.reverbSend?.dispose();
    this.sharedReverb?.dispose();
    this.masterGain = null;
    this.masterLimiter = null;
    this.reverbSend = null;
    this.sharedReverb = null;
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
  private outputGain: Tone.Gain;

  constructor(volume: number) {
    super(volume);

    // True brown noise: white noise integrated (−6 dB/octave), i.e. the
    // classic "white noise but all low end". Tone's generator already uses
    // a leaky integrator, so we feed it straight out with no tonal shaping.
    const brown = new Tone.Noise("brown").start();

    // Only remove inaudible sub-sonic content / DC so speakers don't waste
    // headroom on it. Everything audible is left untouched.
    const dcBlock = new Tone.Filter(20, "highpass", -12);

    this.outputGain = new Tone.Gain(volume * 0.4);

    brown.chain(dcBlock, this.outputGain, AudioEngine.getInstance().getMasterOut());

    [brown, dcBlock, this.outputGain].forEach((node) => this.registerNode(node));
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.setGainWithRamp(this.outputGain, volume * 0.4);
  }
}

class RainSoundNode extends BaseSoundNode {
  private bodyGain: Tone.Gain;
  private airGain: Tone.Gain;
  private rumbleGain: Tone.Gain;

  constructor(volume: number) {
    super(volume);

    const engine = AudioEngine.getInstance();
    const masterOut = engine.getMasterOut();
    // Light room tail (~0.2 wet) so the wash feels open, not smeared
    const wetGain = new Tone.Gain(0.25).connect(engine.getReverbSend());

    // Body: the steady "shhh" of rain on leaves. Pink noise with the sub
    // and the hissy top both rolled off (steep slopes, no resonance).
    const body = new Tone.Noise("pink").start();
    const bodyHigh = new Tone.Filter(180, "highpass", -12);
    const bodyLow = new Tone.Filter(2600, "lowpass", -24);
    this.bodyGain = new Tone.Gain(volume * 0.5);

    // Slow swell so the rain breathes between lighter and heavier.
    // LFO sums onto a 0-valued gain param, so it sets the level itself.
    const swell = new Tone.Gain(0);
    const swellLFO = new Tone.LFO(0.025, 0.8, 1).start();
    swellLFO.connect(swell.gain);

    body.chain(bodyHigh, bodyLow, swell, this.bodyGain, masterOut);
    this.bodyGain.connect(wetGain);

    // Air: a soft, wide mid band that adds the "fullness" of a downpour
    const air = new Tone.Noise("pink").start();
    const airBand = new Tone.Filter(1100, "bandpass");
    airBand.Q.value = 0.35;
    const airLow = new Tone.Filter(3200, "lowpass", -24);
    this.airGain = new Tone.Gain(volume * 0.18);
    air.chain(airBand, airLow, this.airGain, masterOut);

    // Rumble: distant low-end warmth so it's relaxing rather than thin
    const rumble = new Tone.Noise("brown").start();
    const rumbleLow = new Tone.Filter(220, "lowpass", -24);
    this.rumbleGain = new Tone.Gain(volume * 0.22);
    rumble.chain(rumbleLow, this.rumbleGain, masterOut);

    [
      body,
      bodyHigh,
      bodyLow,
      swell,
      swellLFO,
      this.bodyGain,
      air,
      airBand,
      airLow,
      this.airGain,
      rumble,
      rumbleLow,
      this.rumbleGain,
      wetGain,
    ].forEach((node) => this.registerNode(node));
  }

  setVolume(volume: number): void {
    this.volume = volume;
    const isMuted = volume === 0;

    this.setGainWithRamp(this.bodyGain, isMuted ? 0 : volume * 0.5);
    this.setGainWithRamp(this.airGain, isMuted ? 0 : volume * 0.18);
    this.setGainWithRamp(this.rumbleGain, isMuted ? 0 : volume * 0.22);
  }
}

class OceanWavesNode extends BaseSoundNode {
  private masterGain: Tone.Gain;
  private outputGain: Tone.Gain;
  private componentGains: Map<string, Tone.Gain> = new Map();
  private noiseSources: Map<string, Tone.Noise> = new Map();
  private drifting: { lfo: Tone.LFO; base: number }[] = [];
  private driftTimer: ReturnType<typeof setTimeout> | null = null;
  private washTimer: ReturnType<typeof setTimeout> | null = null;
  private washFilter!: Tone.Filter;
  private washGain!: Tone.Gain;
  private disposed = false;

  private scheduleDrift(): void {
    if (this.disposed) return;
    this.driftTimer = setTimeout(() => {
      if (this.disposed) return;
      try {
        this.drifting.forEach(({ lfo, base }) => {
          // ±40% around the base rate, glided over a few seconds
          lfo.frequency.rampTo(base * (0.6 + Math.random() * 0.8), 4 + Math.random() * 4);
        });
      } catch {
        // node disposed mid-tick
      }
      this.scheduleDrift();
    }, 5000 + Math.random() * 6000);
  }

  override dispose(): void {
    this.disposed = true;
    if (this.driftTimer) clearTimeout(this.driftTimer);
    if (this.washTimer) clearTimeout(this.washTimer);
    super.dispose();
  }

  // One wave cycle: the wash rushes in (louder + brighter), lingers, then is
  // pulled back out by the tide (quieter + darker), then a pause before the next.
  private scheduleWave(): void {
    if (this.disposed) return;
    const rise = 3 + Math.random() * 2.5;
    const hold = 0.4 + Math.random() * 0.8;
    const fall = 5 + Math.random() * 3;
    const rest = 0.5 + Math.random() * 2.5;
    const peak = 0.55 + Math.random() * 0.45;

    try {
      this.washFilter.frequency.rampTo(2800 + Math.random() * 1400, rise);
      this.washGain.gain.rampTo(0.5 * peak, rise);
    } catch {
      return;
    }

    this.washTimer = setTimeout(() => {
      if (this.disposed) return;
      try {
        this.washFilter.frequency.rampTo(450, fall);
        this.washGain.gain.rampTo(0.03, fall);
      } catch {
        return;
      }
      this.washTimer = setTimeout(
        () => this.scheduleWave(),
        (fall + rest) * 1000
      );
    }, (rise + hold) * 1000);
  }

  constructor(volume: number) {
    super(volume);

    const engine = AudioEngine.getInstance();
    this.masterGain = new Tone.Gain(0).connect(engine.getMasterOut());
    this.outputGain = new Tone.Gain(0).connect(this.masterGain);

    // Tide wash: brighter pink noise whose level AND brightness swell in and
    // drain out with each wave — the "sea pulled back by the tide" sound.
    const washNoise = new Tone.Noise("pink").start();
    const washHigh = new Tone.Filter(250, "highpass", -12);
    this.washFilter = new Tone.Filter(450, "lowpass", -24);
    this.washFilter.Q.value = 0.5;
    this.washGain = new Tone.Gain(0.03);
    washNoise.chain(washHigh, this.washFilter, this.washGain, this.masterGain);
    [washNoise, washHigh, this.washFilter, this.washGain].forEach((n) =>
      this.registerNode(n)
    );
    this.scheduleWave();

    // Shared reverb send (~0.4 wet) tapped after masterGain so it follows
    // volume, with a short delay to keep ocean's pre-delay character.
    const wetGain = new Tone.Gain(0.67);
    const wetDelay = new Tone.Delay(0.14);
    this.masterGain.connect(wetGain);
    wetGain.connect(wetDelay);
    wetDelay.connect(engine.getReverbSend());

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

    // Irregular swell timing: the main wave cycles get re-tuned at random
    // so no two waves have the same period
    this.drifting.push(
      { lfo: primaryWaveLFO, base: 0.06 },
      { lfo: secondaryWaveLFO, base: 0.12 }
    );
    this.scheduleDrift();

    this.registerNode(this.masterGain);
    this.registerNode(wetGain);
    this.registerNode(wetDelay);
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
    const lowpass = new Tone.Filter(800, "lowpass");
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
    const filter = new Tone.Filter(400, "bandpass");
    filter.Q.value = 2.0;
    const gain = new Tone.Gain(0);

    const washCycleLFO = new Tone.LFO(0.06, 0, 1).start();
    const washFrequencyLFO = new Tone.LFO(0.06, 200, 600).start();
    this.drifting.push({ lfo: washCycleLFO, base: 0.06 });

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
    const filter = new Tone.Filter(600, "bandpass");
    filter.Q.value = 1.5;
    const gain = new Tone.Gain(0);

    const lfo = new Tone.LFO(0.12, 0.05, 0.2).start();
    lfo.connect(gain.gain);
    this.drifting.push({ lfo, base: 0.12 });

    noise.chain(filter, gain, outputGain);

    this.noiseSources.set("breaking", noise);
    this.componentGains.set("breaking", gain);
    [noise, filter, gain, lfo].forEach((n) => this.registerNode(n));
  }

  private createFoam(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("pink").start();
    noise.volume.value = -Infinity;
    const filter = new Tone.Filter(1500, "highpass");
    filter.Q.value = 0.5;
    // Ceiling so the foam stays a soft fizz instead of a hiss
    const ceiling = new Tone.Filter(5000, "lowpass", -24);
    const gain = new Tone.Gain(0);

    // Dips to zero so foam appears as pulses, not a constant layer
    const lfo = new Tone.LFO(0.12, 0, 0.08).start();
    lfo.connect(gain.gain);
    this.drifting.push({ lfo, base: 0.12 });

    noise.chain(filter, ceiling, gain, outputGain);

    this.noiseSources.set("foam", noise);
    this.componentGains.set("foam", gain);
    [noise, filter, ceiling, gain, lfo].forEach((n) => this.registerNode(n));
  }

  private createSplashes(outputGain: Tone.Gain): void {
    const noise = new Tone.Noise("pink").start();
    noise.volume.value = -Infinity;
    const filter = new Tone.Filter(2000, "bandpass");
    filter.Q.value = 1.0;
    const ceiling = new Tone.Filter(4000, "lowpass", -24);
    const gain = new Tone.Gain(0);

    noise.chain(filter, ceiling, gain, outputGain);

    this.noiseSources.set("splash", noise);
    this.componentGains.set("splash", gain);
    [noise, filter, ceiling, gain].forEach((n) => this.registerNode(n));
  }

  private fadeIn(volume: number): void {
    setTimeout(() => {
      // Fade in noise sources
      this.noiseSources.get("deep")?.volume.rampTo(-18, 0.5);
      this.noiseSources.get("main")?.volume.rampTo(-12, 0.5);
      this.noiseSources.get("surface")?.volume.rampTo(-8, 0.5);
      this.noiseSources.get("retreat")?.volume.rampTo(-14, 0.5);
      this.noiseSources.get("breaking")?.volume.rampTo(-10, 0.5);
      this.noiseSources.get("foam")?.volume.rampTo(-16, 0.5);
      this.noiseSources.get("splash")?.volume.rampTo(-18, 0.5);

      // Fade in component gains
      this.componentGains.get("deep")?.gain.rampTo(0.25, 2.5);
      this.componentGains.get("main")?.gain.rampTo(0.6, 2.5);
      this.componentGains.get("surface")?.gain.rampTo(0.4, 2.5);
      this.componentGains.get("retreat")?.gain.rampTo(0.1, 2.8);
      this.componentGains.get("breaking")?.gain.rampTo(0.15, 3.0);
      this.componentGains.get("foam")?.gain.rampTo(0.05, 3.2);
      this.componentGains.get("splash")?.gain.rampTo(0.03, 3.4);

      // Fade in output and master gains
      this.outputGain.gain.rampTo(0.6, 2.5);
      this.masterGain.gain.rampTo(volume * 0.5, 3.0);
    }, 200);
  }

  setVolume(volume: number): void {
    this.volume = volume;
    const isMuted = volume === 0;
    const baseVolume = isMuted ? 0 : Math.max(volume, 0.0001) * 0.5;

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
    max: 5,
    defaultVolume: 0.8,
    volumeMultiplier: 0.5,
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

  static getMaxVolume(key: string, index: number, defaultValue: number): number {
    const stored = localStorage.getItem(`${key}MaxVolume`);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return parsed;
    }
    // Migrate the old component-level "noiseMaxVolumes" array if present
    try {
      const legacy = JSON.parse(localStorage.getItem("noiseMaxVolumes") ?? "null");
      if (Array.isArray(legacy) && typeof legacy[index] === "number") {
        return legacy[index];
      }
    } catch {}
    return defaultValue;
  }

  static setMaxVolume(key: string, maxVolume: number): void {
    localStorage.setItem(`${key}MaxVolume`, maxVolume.toString());
  }
}

// ==================== CONTEXT ====================
const NoiseContext = createContext<NoiseContextType | undefined>(undefined);

export function NoiseProvider({ children }: { children: ReactNode }) {
  const audioEngine = useRef(AudioEngine.getInstance());
  const soundNodes = useRef<Map<string, SoundNode>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  const [sounds, setSounds] = useState<Sound[]>(() =>
    SOUND_CONFIGS.map((config, index) => ({
      key: config.key,
      label: config.label,
      icon: config.icon,
      min: config.min,
      max: SoundStorage.getMaxVolume(config.key, index, config.max),
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

  const setMaxVolume = useCallback(
    (index: number, maxVolume: number): void => {
      const sound = sounds[index];
      const config = SOUND_CONFIGS[index];
      if (!sound || !config || !isFinite(maxVolume)) return;

      const clampedMax = Math.max(0.1, maxVolume);
      const newVolume = Math.min(sound.volume, clampedMax);

      setSounds((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, max: clampedMax, volume: newVolume } : s
        )
      );

      SoundStorage.setMaxVolume(sound.key, clampedMax);

      // Clamp the live node if the current volume exceeds the new max —
      // handled here instead of via setVolume so it never auto-starts sound.
      if (newVolume !== sound.volume) {
        SoundStorage.setVolume(sound.key, newVolume);
        const node = soundNodes.current.get(sound.key);
        if (node && sound.isPlaying) {
          node.setVolume(newVolume * config.volumeMultiplier);
        }
      }
    },
    [sounds]
  );

  const toggleAllSounds = useCallback(async (): Promise<void> => {
    const allPlaying = sounds.every((s) => s.isPlaying);

    if (allPlaying) {
      sounds.forEach((_, i) => stopSound(i));
    } else {
      // Stagger starts so heavy graphs (reverb impulse responses, noise banks)
      // are not all built on the same frame — that spike caused audio underruns.
      sounds
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => !s.isPlaying)
        .forEach(({ i }, order) => {
          setTimeout(
            () => void startSound(i).catch(console.error),
            order * 150
          );
        });
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
        setMaxVolume,
        toggleAllSounds,
        isInitialized,
        initializeAudio,
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