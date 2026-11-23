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

  private initPromise: Promise<boolean> | null = null;

  // Concurrent callers (user click + restore-on-refresh) share one run, so the
  // audio context is never created twice. A failed run can be retried.
  initialize(): Promise<boolean> {
    if (this.initialized) return Promise.resolve(true);
    this.initPromise ??= this.doInitialize().then((ok) => {
      if (!ok) this.initPromise = null;
      return ok;
    });
    return this.initPromise;
  }

  private async doInitialize(): Promise<boolean> {
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
    this.initPromise = null;
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

// Sounds below are built from simple Tone.js primitives: filtered noise plus,
// for rain and waves, a Transport-scheduled Loop. Each node scales one output
// gain by the user volume and tears down its own loops on dispose.
abstract class LoopedSoundNode extends BaseSoundNode {
  protected loops: Tone.Loop[] = [];
  protected outputGain!: Tone.Gain;

  protected startLoop(loop: Tone.Loop): void {
    const transport = Tone.getTransport();
    // Start at the current transport position (not 0): the transport is a
    // shared singleton that is usually already running.
    loop.start(transport.seconds);
    if (transport.state !== "started") transport.start();
    this.loops.push(loop);
  }

  override dispose(): void {
    this.loops.forEach((loop) => {
      try {
        loop.stop();
        loop.dispose();
      } catch (e) {
        console.warn("Error disposing loop:", e);
      }
    });
    this.loops = [];
    super.dispose();
  }
}

// Brown noise: Tone's built-in generator (−6 dB/octave), softened a little.
class BrownNoiseNode extends BaseSoundNode {
  private outputGain: Tone.Gain;

  constructor(volume: number) {
    super(volume);

    const noise = new Tone.Noise("brown").start();

    // Bassy and smooth: remove inaudible sub-sonic energy, cut everything
    // above ~300 Hz steeply (no resonance bump), and add a gentle low shelf.
    const highpass = new Tone.Filter(25, "highpass", -12);
    const lowpass = new Tone.Filter({ type: "lowpass", frequency: 300, rolloff: -24, Q: 0.5 });
    const lowShelf = new Tone.Filter({ type: "lowshelf", frequency: 140, gain: 4 });

    this.outputGain = new Tone.Gain(0).connect(AudioEngine.getInstance().getMasterOut());
    noise.chain(highpass, lowpass, lowShelf, this.outputGain);
    this.outputGain.gain.rampTo(volume * 0.2, 0.5);

    [noise, highpass, lowpass, lowShelf, this.outputGain].forEach((n) => this.registerNode(n));
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.setGainWithRamp(this.outputGain, volume * 0.2);
  }
}

class RainSoundNode extends LoopedSoundNode {
  constructor(volume: number) {
    super(volume);

    const engine = AudioEngine.getInstance();
    this.outputGain = new Tone.Gain(0).connect(engine.getMasterOut());
    // ~0.25 wet via the shared reverb
    const wetSend = new Tone.Gain(0.33).connect(engine.getReverbSend());
    this.outputGain.connect(wetSend);

    const bed = new Tone.Noise("pink").start();
    const highpass = new Tone.Filter(500, "highpass");
    const lowpass = new Tone.Filter(8000, "lowpass");
    const bedGain = new Tone.Gain(0.3);
    bed.chain(highpass, lowpass, bedGain, this.outputGain);

    const dropFilter = new Tone.Filter({ type: "bandpass", frequency: 3000, Q: 3 });
    const dropPan = new Tone.Panner(0);
    const drop = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
      volume: -10,
    });
    drop.chain(dropFilter, dropPan, this.outputGain);

    const dropLoop = new Tone.Loop((time) => {
      dropFilter.frequency.setValueAtTime(1500 + Math.random() * 6000, time);
      dropPan.pan.setValueAtTime(Math.random() * 2 - 1, time);
      drop.triggerAttackRelease(0.02, time, 0.2 + Math.random() * 0.8);
    }, 0.025);
    dropLoop.probability = 0.5; // higher = heavier rain
    dropLoop.humanize = 0.02; // avoids a metronome feel
    this.startLoop(dropLoop);

    [bed, highpass, lowpass, bedGain, dropFilter, dropPan, drop, wetSend, this.outputGain].forEach(
      (n) => this.registerNode(n)
    );
    this.outputGain.gain.rampTo(volume * 0.7, 0.5);
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.setGainWithRamp(this.outputGain, volume * 0.7);
  }
}

// Waves: one wave at a time, wide stereo that stays even. Left and right use
// independent (uncorrelated) noise for width, but share ONE envelope, so both
// sides swell and drain together at the same level. Per wave: a single slow
// build, a short crest, and one long retreat — then a pause before the next.
//   sea   — brown-noise low end that swells with the wave
//   body  — pink-noise mids, level + brightness follow the wave
//   foam  — white-noise high end: fizzes at the crest, fades as water drains
interface OceanChannel {
  seaGain: Tone.Gain;
  bodyGain: Tone.Gain;
  bodyFilter: Tone.Filter;
  foamGain: Tone.Gain;
  foamLow: Tone.Filter;
}

class OceanWavesNode extends LoopedSoundNode {
  private channels: OceanChannel[] = [];

  constructor(volume: number) {
    super(volume);

    const engine = AudioEngine.getInstance();
    this.outputGain = new Tone.Gain(0).connect(engine.getMasterOut());
    this.registerNode(this.outputGain);

    this.channels.push(this.createChannel(-0.7), this.createChannel(0.7));

    this.outputGain.gain.rampTo(volume * 0.85, 1.5);

    // Waves are scheduled one after another (never overlapping) with a
    // rule-based "controlled random" rhythm — see runWave().
    const transport = Tone.getTransport();
    if (transport.state !== "started") transport.start();
    this.eventId = transport.scheduleOnce((time) => this.runWave(time), "+0.2");
  }

  // ---- Controlled randomness -------------------------------------------
  // Real swell comes in sets: a few waves close together, then a lull.
  //  - sets of 2-4 waves, short rests inside a set, a long lull between sets
  //  - size is a bounded random walk that drifts back toward "medium", so
  //    a big wave tends to be followed by a smaller one (never extremes twice)
  //  - bigger waves take a little longer to build and to drain
  //  - two consecutive waves never last nearly the same time
  private eventId: number | null = null;
  private waveInSet = 0;
  private setSize = 3;
  private lastPeak = 0.75;
  private lastTotal = 0;

  private runWave(time: number): void {
    if (this.disposed) return;

    const drift = (Math.random() - 0.5) * 0.5 + (0.75 - this.lastPeak) * 0.35;
    const peak = Math.min(1, Math.max(0.5, this.lastPeak + drift));
    const roll = () => ({
      rise: 3.2 + peak * 1.2 + Math.random() * 0.5,
      fall: 5.5 + peak * 1.5 + Math.random() * 1,
    });
    let { rise, fall } = roll();
    if (Math.abs(rise + fall - this.lastTotal) < 0.8) ({ rise, fall } = roll());
    this.lastPeak = peak;
    this.lastTotal = rise + fall;

    this.playWave(time, rise, fall, peak);

    this.waveInSet += 1;
    let rest: number;
    if (this.waveInSet >= this.setSize) {
      this.waveInSet = 0;
      this.setSize = 2 + Math.floor(Math.random() * 3); // 2-4
      rest = 8 + Math.random() * 5; // long lull between sets
    } else {
      rest = 1.5 + Math.random() * 3; // short rest inside a set
    }

    // +1.2 s lets the foam tail finish so the next wave never overlaps it
    const delay = rise + fall + 1.2 + rest;
    this.eventId = Tone.getTransport().scheduleOnce(
      (t) => this.runWave(t),
      `+${delay}`
    );
  }

  override dispose(): void {
    this.disposed = true;
    if (this.eventId !== null) Tone.getTransport().clear(this.eventId);
    super.dispose();
  }

  private disposed = false;

  private playWave(time: number, rise: number, fall: number, peak: number): void {
    const bright = 2800 + Math.random() * 1500;
    const crest = time + rise;
    const end = crest + fall;

    for (const ch of this.channels) {
      ch.bodyGain.gain.cancelAndHoldAtTime(time);
      ch.bodyGain.gain.linearRampToValueAtTime(0.5 * peak, crest);
      ch.bodyGain.gain.exponentialRampToValueAtTime(0.06, end);

      ch.bodyFilter.frequency.cancelAndHoldAtTime(time);
      ch.bodyFilter.frequency.exponentialRampToValueAtTime(bright, crest);
      ch.bodyFilter.frequency.exponentialRampToValueAtTime(500, end);

      ch.seaGain.gain.cancelAndHoldAtTime(time);
      ch.seaGain.gain.linearRampToValueAtTime(0.1 + 0.12 * peak, crest);
      ch.seaGain.gain.exponentialRampToValueAtTime(0.1, end);

      // Foam rides the same single pass: appears near the crest, gone by the end
      ch.foamGain.gain.cancelAndHoldAtTime(time);
      // One exponential build across the whole rise (linear in dB, so it
      // sounds like a smooth swell), then a long fade on the retreat
      ch.foamGain.gain.exponentialRampToValueAtTime(0.2 * peak, crest + 0.5);
      ch.foamGain.gain.exponentialRampToValueAtTime(0.0005, end + 1);
      ch.foamLow.frequency.cancelAndHoldAtTime(time);
      ch.foamLow.frequency.exponentialRampToValueAtTime(6500, crest + 0.5);
      ch.foamLow.frequency.exponentialRampToValueAtTime(2500, end + 1);
    }
  }

  private createChannel(pan: number): OceanChannel {
    const panner = new Tone.Panner(pan).connect(this.outputGain);

    const sea = new Tone.Noise("brown").start();
    const seaLow = new Tone.Filter(200, "lowpass", -24);
    const seaGain = new Tone.Gain(0.1);
    sea.chain(seaLow, seaGain, panner);

    const body = new Tone.Noise("pink").start();
    const bodyHigh = new Tone.Filter(220, "highpass", -12);
    const bodyFilter = new Tone.Filter(500, "lowpass", -12);
    const bodyGain = new Tone.Gain(0.06);
    body.chain(bodyHigh, bodyFilter, bodyGain, panner);

    const foam = new Tone.Noise("white").start();
    const foamHigh = new Tone.Filter(1800, "highpass", -12);
    const foamLow = new Tone.Filter(6500, "lowpass", -12);
    const foamGain = new Tone.Gain(0.0005);
    foam.chain(foamHigh, foamLow, foamGain, panner);
    // Soft diffuse tail on the highs only: blends the fizz into the wave
    // instead of it popping in. The low end stays dry.
    const foamSend = new Tone.Gain(0.6).connect(AudioEngine.getInstance().getReverbSend());
    foamGain.connect(foamSend);

    [
      panner,
      sea,
      seaLow,
      seaGain,
      body,
      bodyHigh,
      bodyFilter,
      bodyGain,
      foam,
      foamHigh,
      foamLow,
      foamGain,
      foamSend,
    ].forEach((n) => this.registerNode(n));

    return { seaGain, bodyGain, bodyFilter, foamGain, foamLow };
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.setGainWithRamp(this.outputGain, volume * 0.85);
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
    defaultVolume: 1,
    volumeMultiplier: 1,
    create: (volume: number) => new BrownNoiseNode(volume),
  },
  {
    key: "rain",
    label: "Rain Sound",
    icon: "CloudRain",
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 1,
    create: (volume: number) => new RainSoundNode(volume),
  },
  {
    key: "ocean",
    label: "Ocean Waves",
    icon: "Waves",
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 1,
    create: (volume: number) => new OceanWavesNode(volume),
  },
];

// ==================== STORAGE ====================
const MAX_VOLUME = 3;

class SoundStorage {
  static getVolume(key: string, defaultValue: number): number {
    const stored = localStorage.getItem(`${key}Volume`);
    const parsed = stored ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) ? Math.min(parsed, MAX_VOLUME) : defaultValue;
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

  // Max volume is fixed (the settings that changed it were removed), so
  // every sound shares the same slider scale; stored values are ignored.
  static getMaxVolume(_key: string, _index: number, defaultValue: number): number {
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

  // After a refresh the saved "playing" state is restored, but browsers only
  // allow audio after a user gesture. initializeAudio() waits for the first
  // click/key press, then the sounds that were playing start again by themselves.
  const startSoundRef = useRef(startSound);
  startSoundRef.current = startSound;
  const initializeAudioRef = useRef(initializeAudio);
  initializeAudioRef.current = initializeAudio;

  useEffect(() => {
    const toRestore = sounds
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.isPlaying)
      .map(({ i }) => i);
    if (toRestore.length === 0) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    void (async () => {
      const ok = await initializeAudioRef.current();
      if (!ok || cancelled) return;
      toRestore.forEach((index, order) => {
        // staggered, like toggleAllSounds, to avoid building every graph on one frame
        timers.push(
          setTimeout(() => {
            if (!cancelled) void startSoundRef.current(index).catch(console.error);
          }, order * 150)
        );
      });
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // Only on mount: the saved state is what we restore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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