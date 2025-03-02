import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Cloud, CloudRain, Waves } from 'lucide-react';

const NoiseGenerator = () => {
  const [isPlayingBrown, setIsPlayingBrown] = useState(false);
  const [isPlayingRain, setIsPlayingRain] = useState(false);
  const [brownVolume, setBrownVolume] = useState(0.5);
  const [rainVolume, setRainVolume] = useState(12.5);
  const [isPlayingBoth, setIsPlayingBoth] = useState(false);
  const [oceanWaveMode, setOceanWaveMode] = useState(true);
  const [waveSpeed, setWaveSpeed] = useState(1); // Velocidad de las olas (Hz)
  const [waveDepth, setWaveDepth] = useState(0.3); // Profundidad de modulación (0-1)

  const audioContextRef = useRef(null);
  const brownNodeRef = useRef(null);
  const rainNodeRef = useRef(null);
  const brownGainNodeRef = useRef(null);
  const rainGainNodeRef = useRef(null);
  const lastOutRef = useRef(0);
  const animationFrameRef = useRef(null);
  const wavePhaseRef = useRef(0);

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }

    if (!brownGainNodeRef.current) {
      brownGainNodeRef.current = audioContextRef.current.createGain();
      brownGainNodeRef.current.gain.value = brownVolume;
    }

    if (!rainGainNodeRef.current) {
      rainGainNodeRef.current = audioContextRef.current.createGain();
      rainGainNodeRef.current.gain.value = rainVolume;
    }
  };

  const startBrownNoise = () => {
    if (!isPlayingBrown) {
      setupAudioContext();
      const audioCtx = audioContextRef.current;

      const bufferSize = 4096;
      const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      lastOutRef.current = 0;

      node.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          const brown = (lastOutRef.current + 0.02 * white) / 1.02;
          lastOutRef.current = brown;
          output[i] = brown * 3.5;
        }
      };

      node.connect(brownGainNodeRef.current);
      brownGainNodeRef.current.connect(audioCtx.destination);

      brownNodeRef.current = node;
      setIsPlayingBrown(true);
    }
  };

  const startRainNoise = () => {
    if (!isPlayingRain) {
      setupAudioContext();
      const audioCtx = audioContextRef.current;

      const bufferSize = 4096;
      const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);

      // Configuración de filtros
      const highPassFilter = audioCtx.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 300; // Frecuencia más baja para más cuerpo

      const lowPassFilter = audioCtx.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 8000; // Frecuencia más alta para más detalle
      lowPassFilter.Q.value = 0.5;

      // Reverberación
      const reverb = audioCtx.createConvolver();
      const reverbBuffer = audioCtx.createBuffer(2, audioCtx.sampleRate * 2, audioCtx.sampleRate);
      for (let i = 0; i < 2; i++) {
        const channelData = reverbBuffer.getChannelData(i);
        for (let j = 0; j < channelData.length; j++) {
          channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / channelData.length, 2);
        }
      }
      reverb.buffer = reverbBuffer;

      // Variables para suavizado y modulación
      let lastValue = 0;
      let modulation = 0;
      let modulationPhase = 0;
      let dropCounter = 0;

      node.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);

        // Modulación lenta (0.2 Hz)
        modulationPhase += 0.2 / (audioCtx.sampleRate / bufferSize);
        const currentModulation = Math.sin(modulationPhase) * 0.1 + 0.9;

        // Sonido de gotas destacadas (menos pronunciadas en modo océano)
        dropCounter++;
        const dropProbability = oceanWaveMode ? 2500 : 1000; // Menos gotas en modo océano
        if (dropCounter > dropProbability + Math.random() * 2000) {
          dropCounter = 0;
          const dropVolume = (oceanWaveMode ? 0.3 : 0.5) + Math.random() * 0.5;
          const dropDuration = 100 + Math.random() * 200;
          for (let i = 0; i < dropDuration; i++) {
            const t = i / dropDuration;
            const drop = (Math.random() * 2 - 1) * Math.pow(1 - t, 2) * dropVolume;
            if (i < bufferSize) {
              output[i] += drop;
            }
          }
        }

        for (let i = 0; i < bufferSize; i++) {
          // Generación de ruido suavizado
          const white = Math.random() * 2 - 1;

          // Ajuste del coeficiente de suavizado para el modo océano
          const smoothFactor = oceanWaveMode ? 0.98 : 0.96;
          lastValue = smoothFactor * lastValue + (1 - smoothFactor) * white;

          // Aplicar modulación y ajuste de volumen
          output[i] = lastValue * currentModulation * 0.4;
        }
      };

      // Conexión de nodos con filtros y reverberación
      node.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(reverb);
      reverb.connect(rainGainNodeRef.current);
      rainGainNodeRef.current.connect(audioCtx.destination);

      rainNodeRef.current = { node, highPassFilter, lowPassFilter, reverb };
      setIsPlayingRain(true);
    }
  };

  const stopBrownNoise = () => {
    if (isPlayingBrown) {
      brownNodeRef.current.disconnect();
      setIsPlayingBrown(false);
    }
  };

  const stopRainNoise = () => {
    if (isPlayingRain) {
      // Desconectar todos los nodos
      rainNodeRef.current.node.disconnect();
      rainNodeRef.current.highPassFilter.disconnect();
      rainNodeRef.current.lowPassFilter.disconnect();
      rainNodeRef.current.reverb.disconnect();
      setIsPlayingRain(false);
    }
  };

  // Función para iniciar/detener ambos ruidos
  const toggleBothNoises = () => {
    if (!isPlayingBoth) {
      startBrownNoise();
      startRainNoise();
    } else {
      stopBrownNoise();
      stopRainNoise();
    }
    setIsPlayingBoth(!isPlayingBoth);
  };

  // Función para activar/desactivar el modo olas de océano
  const toggleOceanWaveMode = () => {
    setOceanWaveMode(!oceanWaveMode);
  };

  // Actualizar volumen de ruido marrón
  useEffect(() => {
    if (brownGainNodeRef.current) {
      brownGainNodeRef.current.gain.value = brownVolume;
    }
  }, [brownVolume]);

  // Actualizar volumen base de ruido de lluvia
  useEffect(() => {
    if (rainGainNodeRef.current) {
      rainGainNodeRef.current.gain.value = rainVolume;
    }
  }, [rainVolume]);

  // Gestión del efecto de olas del océano
  useEffect(() => {
    // Cancelar animación anterior si existe
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (oceanWaveMode && isPlayingRain && rainGainNodeRef.current) {
      // Función para animar las olas
      const animateWaves = () => {
        if (!rainGainNodeRef.current || !isPlayingRain) return;

        // Incrementar la fase según la velocidad
        wavePhaseRef.current += 0.025 * waveSpeed;

        // Crear un patrón de olas con múltiples sinusoides
        const baseVolume = rainVolume;
        const waveVal = Math.sin(wavePhaseRef.current) * 0.5 +
                        Math.sin(wavePhaseRef.current * 0.5) * 0.3 +
                        Math.sin(wavePhaseRef.current * 0.25) * 0.2;

        // Calcular nuevo volumen con el efecto de olas
        const newVolume = baseVolume * (1 - waveDepth * 0.8 + waveVal * waveDepth);

        // Aplicar cambio de volumen suavemente
        rainGainNodeRef.current.gain.setTargetAtTime(
          newVolume,
          audioContextRef.current.currentTime,
          0.1
        );

        // Continuar animación
        animationFrameRef.current = requestAnimationFrame(animateWaves);
      };

      // Iniciar la animación
      animationFrameRef.current = requestAnimationFrame(animateWaves);
    } else if (!oceanWaveMode && rainGainNodeRef.current) {
      // Restaurar volumen normal
      rainGainNodeRef.current.gain.setTargetAtTime(
        rainVolume,
        audioContextRef.current ? audioContextRef.current.currentTime : 0,
        0.1
      );
    }

    // Limpieza cuando se desmonte el componente
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [oceanWaveMode, isPlayingRain, rainVolume, waveSpeed, waveDepth]);

  // Actualizar el estado de isPlayingBoth cuando cambian isPlayingBrown o isPlayingRain
  useEffect(() => {
    setIsPlayingBoth(isPlayingBrown && isPlayingRain);
  }, [isPlayingBrown, isPlayingRain]);

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg  mr-1 ml-1">
      <h2 className="text-2xl font-bold mb-6">Noise Generator</h2>

      <div className="mb-6 space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <Cloud size={18} />
            <span className="font-medium">Brown Noise Volume</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={brownVolume}
            onChange={(e) => setBrownVolume(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <CloudRain size={18} />
            <span className="font-medium">Rain Noise Volume</span>
          </label>
          <input
            type="range"
            min="0"
            max="25"
            step="0.01"
            value={rainVolume}
            onChange={(e) => setRainVolume(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Ocean Wave Mode Toggle */}
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <Waves size={18} />
              <span className="font-medium">Ocean Wave Mode</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                className="opacity-0 w-0 h-0"
                checked={oceanWaveMode}
                onChange={toggleOceanWaveMode}
                id="waveToggle"
              />
              <label
                htmlFor="waveToggle"
                className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${
                  oceanWaveMode ? 'bg-accent-deep' : 'bg-gray-300'
                }`}
                style={{
                  display: 'block',
                  '::before': {
                    content: '""',
                    position: 'absolute',
                    height: '1.25rem',
                    width: '1.25rem',
                    left: oceanWaveMode ? 'calc(100% - 1.5rem)' : '0.25rem',
                    bottom: '0.25rem',
                    backgroundColor: 'white',
                    transition: 'all 0.3s',
                    borderRadius: '50%'
                  }
                }}
              >
                <span
                  className={`absolute h-5 w-5 rounded-full bg-white transition-all duration-300 ${
                    oceanWaveMode ? 'left-6' : 'left-1'
                  }`}
                  style={{top: '2px'}}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Ocean Wave Controls (solo visibles cuando Ocean Wave Mode está activo) */}
        {oceanWaveMode && (
          <div className="pt-2 space-y-4 pl-6 border-l-2 border-accent-deep">
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="font-medium">Wave Speed</span>
                <span className="text-sm">{waveSpeed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={waveSpeed}
                onChange={(e) => setWaveSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="font-medium">Wave Intensity</span>
                <span className="text-sm">{Math.round(waveDepth * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={waveDepth}
                onChange={(e) => setWaveDepth(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4 flex-wrap">
        {!isPlayingBrown ? (
          <button
            onClick={startBrownNoise}
            className="bg-accent-primary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-deep transition-colors duration-200 flex items-center gap-2"
          >
            <Play size={20} /> Brown Noise
          </button>
        ) : (
          <button
            onClick={stopBrownNoise}
            className="bg-accent-tertiary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-secondary transition-colors duration-200 flex items-center gap-2"
          >
            <Pause size={20} /> Brown Noise
          </button>
        )}

        {!isPlayingRain ? (
          <button
            onClick={startRainNoise}
            className="bg-accent-primary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-deep transition-colors duration-200 flex items-center gap-2"
          >
            <Play size={20} /> Rain Noise
          </button>
        ) : (
          <button
            onClick={stopRainNoise}
            className="bg-accent-tertiary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-secondary transition-colors duration-200 flex items-center gap-2"
          >
            <Pause size={20} /> Rain Noise
          </button>
        )}

        {!isPlayingBoth ? (
          <button
            onClick={toggleBothNoises}
            className="bg-accent-primary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-deep transition-colors duration-200 flex items-center gap-2"
          >
            <Play size={20} />
          </button>
        ) : (
          <button
            onClick={toggleBothNoises}
            className="bg-accent-tertiary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-secondary transition-colors duration-200 flex items-center gap-2"
          >
            <Pause size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NoiseGenerator;
