import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Cloud, CloudRain, Waves } from "lucide-react";
import * as Tone from "tone";

const NoiseGenerator = () => {
    // Load saved volumes from localStorage or use defaults
    const [brownVolume, setBrownVolume] = useState(() => {
        const saved = localStorage.getItem("brownVolume");
        return saved ? parseFloat(saved) : 2.5; // Default to middle (1.0)
    });
    const [rainVolume, setRainVolume] = useState(() => {
        const saved = localStorage.getItem("rainVolume");
        return saved ? parseFloat(saved) : 12.5;
    });
    const [oceanVolume, setOceanVolume] = useState(() => {
        const saved = localStorage.getItem("oceanVolume");
        return saved ? parseFloat(saved) : 12.5;
    });
    const [isPlayingBrown, setIsPlayingBrown] = useState(false);
    const [isPlayingRain, setIsPlayingRain] = useState(false);
    const [isPlayingOcean, setIsPlayingOcean] = useState(false);
    const [isPlayingAll, setIsPlayingAll] = useState(false);

    const brownNoiseRef = useRef(null);
    const rainNoiseRef = useRef(null);
    const oceanNoiseRef = useRef(null);
    const masterGainRef = useRef(null);

    // Nueva función para inicializar Tone.js
    const initAudioContext = async () => {
        await Tone.start();
        masterGainRef.current = new Tone.Gain(1).toDestination();
        Tone.context.latencyHint = "interactive";
    };

    // Save volumes to localStorage when they change
    useEffect(() => {
        localStorage.setItem("brownVolume", brownVolume.toString());
    }, [brownVolume]);

    useEffect(() => {
        localStorage.setItem("rainVolume", rainVolume.toString());
    }, [rainVolume]);

    useEffect(() => {
        localStorage.setItem("oceanVolume", oceanVolume.toString());
    }, [oceanVolume]);

    // Effect for brown noise volume
    useEffect(() => {
        if (brownNoiseRef.current?.gain) {
            brownNoiseRef.current.gain.gain.value = brownVolume;
        }
    }, [brownVolume]);

    // Effect for rain noise volume
    useEffect(() => {
        if (rainNoiseRef.current?.gain) {
            rainNoiseRef.current.gain.gain.value = rainVolume * 0.04;
        }
    }, [rainVolume]);

    // Effect for ocean wave volume
    useEffect(() => {
        if (oceanNoiseRef.current?.gain) {
            oceanNoiseRef.current.gain.gain.value = oceanVolume * 0.03;
        }
    }, [oceanVolume]);

    // Función para iniciar Brown Noise
    const startBrownNoise = async () => {
        if (!masterGainRef.current) {
            await initAudioContext();
        }
        if (!brownNoiseRef.current) {
            const brownNoise = new Tone.Noise("brown").start();
            const filter = new Tone.Filter(200, "lowpass");
            const gainNode = new Tone.Gain(brownVolume);
            brownNoise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(masterGainRef.current);
            brownNoiseRef.current = { noise: brownNoise, filter, gain: gainNode };
        }
        setIsPlayingBrown(true);
    };

    const stopBrownNoise = () => {
        if (brownNoiseRef.current) {
            brownNoiseRef.current.noise.stop();
            brownNoiseRef.current.noise.dispose();
            brownNoiseRef.current.filter.dispose();
            brownNoiseRef.current.gain.dispose();
            brownNoiseRef.current = null;
        }
        setIsPlayingBrown(false);
    };

    // Función para iniciar Rain Noise
    const startRainNoise = async () => {
        if (!masterGainRef.current) {
            await initAudioContext();
        }
        if (!rainNoiseRef.current) {
            const rainNoise = new Tone.Noise("pink").start();
            const highpassFilter = new Tone.Filter(200, "highpass");
            const lowpassFilter = new Tone.Filter(2000, "lowpass");
            const gainNode = new Tone.Gain(rainVolume * 0.02);
            rainNoise.connect(highpassFilter);
            highpassFilter.connect(lowpassFilter);
            lowpassFilter.connect(gainNode);
            gainNode.connect(masterGainRef.current);
            rainNoiseRef.current = {
                noise: rainNoise,
                highpassFilter,
                lowpassFilter,
                gain: gainNode,
            };
        }
        setIsPlayingRain(true);
    };

    const stopRainNoise = () => {
        if (rainNoiseRef.current) {
            rainNoiseRef.current.noise.stop();
            rainNoiseRef.current.noise.dispose();
            rainNoiseRef.current.highpassFilter.dispose();
            rainNoiseRef.current.lowpassFilter.dispose();
            rainNoiseRef.current.gain.dispose();
            rainNoiseRef.current = null;
        }
        setIsPlayingRain(false);
    };

    // Función para iniciar Ocean Waves
    const startOceanWaves = async () => {
        if (!masterGainRef.current) {
            await initAudioContext();
        }
        if (!oceanNoiseRef.current) {
            const oceanNoise = new Tone.Noise("pink").start();

            // Create a low-pass filter with a lower frequency for more bass
            const filter = new Tone.Filter(300, "lowpass");

            // Create an LFO to modulate the filter frequency
            const lfo = new Tone.LFO({
                frequency: 0.1, // Very slow modulation
                min: 200,
                max: 400,
                type: "sine",
            }).start();

            // Connect the LFO to the filter frequency
            lfo.connect(filter.frequency);

            // Add some reverb for more space
            const reverb = new Tone.Reverb({
                decay: 4,
                wet: 0.3,
                preDelay: 0.2,
            }).toDestination();

            const gainNode = new Tone.Gain(oceanVolume * 0.03);

            // Connect the nodes
            oceanNoise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(reverb);

            oceanNoiseRef.current = {
                noise: oceanNoise,
                filter,
                gain: gainNode,
                lfo,
                reverb,
            };
        }
        setIsPlayingOcean(true);
    };

    const stopOceanWaves = () => {
        if (oceanNoiseRef.current) {
            oceanNoiseRef.current.noise.stop();
            oceanNoiseRef.current.noise.dispose();
            oceanNoiseRef.current.filter.dispose();
            oceanNoiseRef.current.gain.dispose();
            oceanNoiseRef.current.lfo.dispose();
            oceanNoiseRef.current.reverb.dispose();
            oceanNoiseRef.current = null;
        }
        setIsPlayingOcean(false);
    };

    // Función para controlar todos los sonidos
    const toggleAllSounds = async () => {
        // Inicializa el audio si no se ha hecho
        if (!masterGainRef.current) {
            await initAudioContext();
        }

        if (isPlayingAll) {

            stopBrownNoise();
            stopRainNoise();
            stopOceanWaves();
            setIsPlayingAll(false);
        } else {

            startBrownNoise();
            startRainNoise();
            startOceanWaves();
            setIsPlayingAll(true);
        }
    };

    // Actualizar isPlayingAll cuando se detiene un sonido individualmente
    useEffect(() => {
        if (!isPlayingBrown || !isPlayingRain || !isPlayingOcean) {
            setIsPlayingAll(false);
        }
        if (isPlayingBrown && isPlayingRain && isPlayingOcean) {
            setIsPlayingAll(true);
        }
    }, [isPlayingBrown, isPlayingRain, isPlayingOcean]);

    // Limpieza al desmontar el componente
    useEffect(() => {
        return () => {
            stopBrownNoise();
            stopRainNoise();
            stopOceanWaves();
            if (masterGainRef.current) {
                masterGainRef.current.dispose();
            }
        };
    }, []);

    // Add event listeners for external control
    useEffect(() => {
        const handleStartBrownNoise = () => {
            startBrownNoise();
        };

        const handleStartRainNoise = () => {
            startRainNoise();
        };

        const handleStartOceanWaves = () => {
            startOceanWaves();
        };

        const handleStopBrownNoise = () => {
            stopBrownNoise();
        };

        const handleStopRainNoise = () => {
            stopRainNoise();
        };

        const handleStopOceanWaves = () => {
            stopOceanWaves();
        };

        window.addEventListener("startBrownNoise", handleStartBrownNoise);
        window.addEventListener("startRainNoise", handleStartRainNoise);
        window.addEventListener("startOceanWaves", handleStartOceanWaves);
        window.addEventListener("stopBrownNoise", handleStopBrownNoise);
        window.addEventListener("stopRainNoise", handleStopRainNoise);
        window.addEventListener("stopOceanWaves", handleStopOceanWaves);

        return () => {
            window.removeEventListener("startBrownNoise", handleStartBrownNoise);
            window.removeEventListener("startRainNoise", handleStartRainNoise);
            window.removeEventListener("startOceanWaves", handleStartOceanWaves);
            window.removeEventListener("stopBrownNoise", handleStopBrownNoise);
            window.removeEventListener("stopRainNoise", handleStopRainNoise);
            window.removeEventListener("stopOceanWaves", handleStopOceanWaves);
        };
    }, []);

    return (
        <div className="maincard">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Noise Generator</h2>
                <button
                    onClick={toggleAllSounds}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors duration-200"
                >
                    {isPlayingAll ? (
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
                {/* Control para Brown Noise */}
                <div className="bar">
                    <label className="noisegentitle">
                        <Cloud size={18} />
                        <span className="card-text font-medium text-white text-md">
                            Brown Noise
                        </span>
                    </label>
                    <div className="slider">
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.01"
                            value={brownVolume}
                            onChange={(e) => setBrownVolume(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                        />
                        <div className="w-8 flex justify-center">
                            {!isPlayingBrown ? (
                                <button
                                    onClick={startBrownNoise}
                                    className="text-white hover:text-accent-secondary"
                                >
                                    <Play size={20} />
                                </button>
                            ) : (
                                <button
                                    onClick={stopBrownNoise}
                                    className="text-accent-tertiary hover:text-accent-secondary"
                                >
                                    <Pause size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Control para Rain Sound */}
                <div className="bar">
                    <label className="noisegentitle">
                        <CloudRain size={18} />
                        <span className="card-text font-medium text-white text-md">Rain Sound</span>
                    </label>
                    <div className="slider">
                        <input
                            type="range"
                            min="0"
                            max="25"
                            step="0.01"
                            value={rainVolume}
                            onChange={(e) => setRainVolume(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                        />
                        <div className="w-8 flex justify-center">
                            {!isPlayingRain ? (
                                <button
                                    onClick={startRainNoise}
                                    className="text-white hover:text-accent-secondary"
                                >
                                    <Play size={20} />
                                </button>
                            ) : (
                                <button
                                    onClick={stopRainNoise}
                                    className="text-accent-tertiary hover:text-accent-secondary"
                                >
                                    <Pause size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Control para Ocean Waves */}
                <div className="bar">
                    <label className="noisegentitle">
                        <Waves size={18} />
                        <span className="card-text font-medium text-white text-md">
                            Ocean Waves
                        </span>
                    </label>
                    <div className="slider">
                        <input
                            type="range"
                            min="0"
                            max="25"
                            step="0.01"
                            value={oceanVolume}
                            onChange={(e) => setOceanVolume(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                        />
                        <div className="w-8 flex justify-center">
                            {!isPlayingOcean ? (
                                <button
                                    onClick={startOceanWaves}
                                    className="text-white hover:text-accent-secondary"
                                >
                                    <Play size={20} />
                                </button>
                            ) : (
                                <button
                                    onClick={stopOceanWaves}
                                    className="text-accent-tertiary hover:text-accent-secondary"
                                >
                                    <Pause size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoiseGenerator;
