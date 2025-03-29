import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Cloud, CloudRain, Waves } from 'lucide-react';
import * as Tone from 'tone';

const NoiseGenerator = () => {
    // Load saved volumes from localStorage or use defaults
    const [brownVolume, setBrownVolume] = useState(() => {
        const saved = localStorage.getItem('brownVolume');
        return saved ? parseFloat(saved) : 1.0; // Default to middle (1.0)
    });
    const [rainVolume, setRainVolume] = useState(() => {
        const saved = localStorage.getItem('rainVolume');
        return saved ? parseFloat(saved) : 12.5;
    });
    const [oceanVolume, setOceanVolume] = useState(() => {
        const saved = localStorage.getItem('oceanVolume');
        return saved ? parseFloat(saved) : 12.5;
    });
    const [isPlayingBrown, setIsPlayingBrown] = useState(false);
    const [isPlayingRain, setIsPlayingRain] = useState(false);
    const [isPlayingOcean, setIsPlayingOcean] = useState(false);

    const brownNoiseRef = useRef(null);
    const rainNoiseRef = useRef(null);
    const oceanNoiseRef = useRef(null);
    const masterGainRef = useRef(null);

    // Initialize Tone.js context and create master gain
    useEffect(() => {
        const initTone = async () => {
            await Tone.start();
            masterGainRef.current = new Tone.Gain(1).toDestination();
            Tone.context.latencyHint = 'interactive';
        };
        initTone();
    }, []);

    // Save volumes to localStorage when they change
    useEffect(() => {
        localStorage.setItem('brownVolume', brownVolume.toString());
    }, [brownVolume]);

    useEffect(() => {
        localStorage.setItem('rainVolume', rainVolume.toString());
    }, [rainVolume]);

    useEffect(() => {
        localStorage.setItem('oceanVolume', oceanVolume.toString());
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
    const startBrownNoise = () => {
        if (!brownNoiseRef.current) {
            const brownNoise = new Tone.Noise('brown').start();
            const filter = new Tone.Filter(200, 'lowpass');
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
    const startRainNoise = () => {
        if (!rainNoiseRef.current) {
            const rainNoise = new Tone.Noise('pink').start();
            const highpassFilter = new Tone.Filter(200, 'highpass');
            const lowpassFilter = new Tone.Filter(2000, 'lowpass');
            const gainNode = new Tone.Gain(rainVolume * 0.02);
            rainNoise.connect(highpassFilter);
            highpassFilter.connect(lowpassFilter);
            lowpassFilter.connect(gainNode);
            gainNode.connect(masterGainRef.current);
            rainNoiseRef.current = { noise: rainNoise, highpassFilter, lowpassFilter, gain: gainNode };
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
    const startOceanWaves = () => {
        if (!oceanNoiseRef.current) {
            const oceanNoise = new Tone.Noise('pink').start();
            const filter = new Tone.Filter(500, 'lowpass');
            const gainNode = new Tone.Gain(oceanVolume * 0.03);
            oceanNoise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(masterGainRef.current);
            oceanNoiseRef.current = { noise: oceanNoise, filter, gain: gainNode };
        }
        setIsPlayingOcean(true);
    };

    const stopOceanWaves = () => {
        if (oceanNoiseRef.current) {
            oceanNoiseRef.current.noise.stop();
            oceanNoiseRef.current.noise.dispose();
            oceanNoiseRef.current.filter.dispose();
            oceanNoiseRef.current.gain.dispose();
            oceanNoiseRef.current = null;
        }
        setIsPlayingOcean(false);
    };

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

        window.addEventListener('startBrownNoise', handleStartBrownNoise);
        window.addEventListener('startRainNoise', handleStartRainNoise);
        window.addEventListener('startOceanWaves', handleStartOceanWaves);
        window.addEventListener('stopBrownNoise', handleStopBrownNoise);
        window.addEventListener('stopRainNoise', handleStopRainNoise);
        window.addEventListener('stopOceanWaves', handleStopOceanWaves);

        return () => {
            window.removeEventListener('startBrownNoise', handleStartBrownNoise);
            window.removeEventListener('startRainNoise', handleStartRainNoise);
            window.removeEventListener('startOceanWaves', handleStartOceanWaves);
            window.removeEventListener('stopBrownNoise', handleStopBrownNoise);
            window.removeEventListener('stopRainNoise', handleStopRainNoise);
            window.removeEventListener('stopOceanWaves', handleStopOceanWaves);
        };
    }, []);

    return (
        <div className="maincard">
            <h2 className="text-2xl font-bold mb-6">Noise Generator</h2>
            <div className="mb-6 space-y-4">
                {/* Control para Brown Noise */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                        <Cloud size={18} />
                        <span className="card-text font-medium text-white">Brown Noise</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.01"
                            value={brownVolume}
                            onChange={(e) => setBrownVolume(parseFloat(e.target.value))}
                            className="w-64"
                        />
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

                {/* Control para Rain Sound */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                        <CloudRain size={18} />
                        <span className="card-text font-medium text-white">Rain Sound</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0"
                            max="25"
                            step="0.01"
                            value={rainVolume}
                            onChange={(e) => setRainVolume(parseFloat(e.target.value))}
                            className="w-64"
                        />
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

                {/* Control para Ocean Waves */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                        <Waves size={18} />
                        <span className="card-text font-medium text-white">Ocean Waves</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0"
                            max="25"
                            step="0.01"
                            value={oceanVolume}
                            onChange={(e) => setOceanVolume(parseFloat(e.target.value))}
                            className="w-64"
                        />
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
    );
};

export default NoiseGenerator;
