import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

const NoiseGenerator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioContextRef = useRef(null);
  const nodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const lastOutRef = useRef(0);

  const setupAudioContext = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const gainNode = audioCtx.createGain();
    
    gainNode.gain.value = volume;
    
    audioContextRef.current = audioCtx;
    gainNodeRef.current = gainNode;
  };

  const startNoise = () => {
    if (!isPlaying) {
      if (!audioContextRef.current) setupAudioContext();
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

      node.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioCtx.destination);
      
      nodeRef.current = node;
      setIsPlaying(true);
    }
  };

  const stopNoise = () => {
    if (isPlaying) {
      nodeRef.current.disconnect();
      audioContextRef.current.close();
      audioContextRef.current = null;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg  mr-1 ml-1">
      <h2 className="text-2xl font-bold mb-6">Brown Noise Generator</h2>

      <div className="mb-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <Volume2 size={18} />
            <span className="font-medium">Volume</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {!isPlaying ? (
          <button
            onClick={startNoise}
            className="bg-accent-primary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-deep transition-colors duration-200 flex items-center gap-2"
          >
            <Play size={20} /> Start
          </button>
        ) : (
          <button
            onClick={stopNoise}
            className="bg-accent-tertiary text-text-primary px-6 py-3 rounded-lg hover:bg-accent-secondary transition-colors duration-200 flex items-center gap-2"
          >
            <Pause size={20} /> Stop
          </button>
        )}
      </div>
    </div>
  );
};

export default NoiseGenerator;