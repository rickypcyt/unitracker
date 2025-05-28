import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div 
      className="loading-spinner-container flex items-center justify-center w-full h-full"
      role="status"
      aria-label="Loading"
    >
      <motion.div
        className="loading-spinner"
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="60 20"
          />
        </svg>
      </motion.div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner; 