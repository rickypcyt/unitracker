import * as Tone from 'tone';

import { Clock, Cloud, CloudRain, Pause, Play, Timer, Waves, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import BaseMenu from '../common/BaseMenu';
import { motion } from 'framer-motion';
import { setCalendarVisibility } from '../../redux/uiSlice';
import { toast } from 'react-toastify';
import { updateTask } from '../../redux/TaskActions';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { useTaskManager } from '../../hooks/useTaskManager';

const StartSessionMenu = ({
  x,
  y,
  onClose,
  onStartSession,
  onStartTimer,
  onStartPomodoro,
}) => {
  return (
    <BaseMenu
      x={Math.min(x, window.innerWidth - 220)}
      y={Math.min(y, window.innerHeight - 150)}
      onClose={onClose}
      aria-label="Start session menu"
    >
      <div className="space-y-1">
        <button
          onClick={() => {
            onStartSession();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-base bg-neutral-800 hover:bg-neutral-700 rounded-md bg-opacity-60 flex items-center gap-2 transition-colors duration-200"
        >
          <Play size={16} />
          Start Session
        </button>
        <button
          onClick={() => {
            onStartTimer();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-base bg-neutral-800 hover:bg-neutral-700 rounded-md bg-opacity-60 flex items-center gap-2 transition-colors duration-200"
        >
          <Clock size={16} />
          Start Timer
        </button>
        <button
          onClick={() => {
            onStartPomodoro();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-base bg-neutral-800 hover:bg-neutral-700 rounded-md bg-opacity-60 flex items-center gap-2 transition-colors duration-200"
        >
          <Timer size={16} />
          Start Pomodoro
        </button>
      </div>
    </BaseMenu>
  );
};

export default StartSessionMenu; 