import React, { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const BrownNoise = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const nodeRef = useRef(null);
  const lastOutRef = useRef(0);

  const startNoise = () => {
    if (!isPlaying) {
      // Crea un nuevo AudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      // Crea un ScriptProcessorNode para generar el ruido
      const bufferSize = 4096;
      const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      lastOutRef.current = 0;

      node.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1; // ruido blanco
          // Genera ruido Brown a partir de una suma acumulada con atenuación
          const brown = (lastOutRef.current + 0.02 * white) / 1.02;
          lastOutRef.current = brown;
          output[i] = brown * 3.5; // Ajusta la ganancia para compensar la atenuación
        }
      };

      node.connect(audioCtx.destination);
      nodeRef.current = node;
      setIsPlaying(true);
    }
  };

  const stopNoise = () => {
    if (isPlaying) {
      if (nodeRef.current) {
        nodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg transition-all duration-300 ease-in-out hover:translate-y-[-0.2rem] hover:shadow-xl mr-1 ml-1">
      <h2 className="text-2xl font-bold mb-6">Brown Noise Generator</h2>
      <div className="flex justify-center space-x-4 mb-6">
        {!isPlaying ? (
          <button
            onClick={startNoise}
            className="bg-accent-primary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-deep transition-colors duration-200"
          >
            <Play size={20} />
          </button>
        ) : (
          <button
            onClick={stopNoise}
            className="bg-accent-tertiary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-secondary transition-colors duration-200"
          >
            <Pause size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default BrownNoise;
