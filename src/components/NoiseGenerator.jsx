import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Cloud, CloudRain } from 'lucide-react';

const NoiseGenerator = () => {
  const [isPlayingBrown, setIsPlayingBrown] = useState(false);
  const [isPlayingRain, setIsPlayingRain] = useState(false);
  const [brownVolume, setBrownVolume] = useState(1);
  const [rainVolume, setRainVolume] = useState(12.5);
  const audioContextRef = useRef(null);
  const brownNodeRef = useRef(null);
  const rainNodeRef = useRef(null);
  const brownGainNodeRef = useRef(null);
  const rainGainNodeRef = useRef(null);
  const lastOutRef = useRef(0);

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
        
        // Sonido de gotas destacadas
        dropCounter++;
        if (dropCounter > 1000 + Math.random() * 2000) {
          dropCounter = 0;
          const dropVolume = 0.5 + Math.random() * 0.5;
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
          lastValue = 0.96 * lastValue + 0.04 * white;
          
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

  useEffect(() => {
    if (brownGainNodeRef.current) {
      brownGainNodeRef.current.gain.value = brownVolume;
    }
  }, [brownVolume]);

  useEffect(() => {
    if (rainGainNodeRef.current) {
      rainGainNodeRef.current.gain.value = rainVolume;
    }
  }, [rainVolume]);

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
      </div>

      <div className="flex justify-center space-x-4">
        {!isPlayingBrown ? (
          <button
            onClick={startBrownNoise}
            className="bg-accent-primary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-deep transition-colors duration-200 flex items-center gap-2"
          >
            <Play size={20} /> Start Brown Noise
          </button>
        ) : (
          <button
            onClick={stopBrownNoise}
            className="bg-accent-tertiary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-secondary transition-colors duration-200 flex items-center gap-2"
          >
            <Pause size={20} /> Stop Brown Noise
          </button>
        )}

        {!isPlayingRain ? (
          <button
            onClick={startRainNoise}
            className="bg-accent-primary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-deep transition-colors duration-200 flex items-center gap-2"
          >
            <Play size={20} /> Start Rain Noise
          </button>
        ) : (
          <button
            onClick={stopRainNoise}
            className="bg-accent-tertiary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-secondary transition-colors duration-200 flex items-center gap-2"
          >
            <Pause size={20} /> Stop Rain Noise
          </button>
        )}
      </div>
    </div>
  );
};

export default NoiseGenerator;
