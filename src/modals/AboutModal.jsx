import { Github, Info, Mail } from 'lucide-react';

import BaseModal from '@/modals/BaseModal';
import React from 'react';

const AboutModal = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="About Uni Tracker"
      maxWidth="max-w-2xl"
      className=""
    >
      <div className="flex flex-col items-center justify-center px-4 py-2 space-y-6">
        <Info size={48} className="text-[var(--accent-primary)] mb-2" />
        {/* The Story */}
        <div className="w-full max-w-xl text-center space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">The Story</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Uni Tracker was born in December 2024 from a simple idea: to create a better way to manage university assignments and tasks. As a student myself, I noticed the need for a tool that could help organize academic work more effectively while being intuitive and user-friendly.
          </p>
        </div>
        {/* About Me */}
        <div className="w-full max-w-xl text-center space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">About Me</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Hi! I'm Ricky, the creator of Uni Tracker. I'm passionate about building tools that make life easier for students. This project represents my commitment to improving the academic experience through technology.
          </p>
        </div>
        {/* Get in Touch */}
        <div className="w-full max-w-xl text-center space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Get in Touch</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-2">
            I'm always open to feedback, suggestions, or just a friendly chat about the app. Whether you've found a bug, have a feature request, or want to share your experience, I'd love to hear from you!
          </p>
          <div className="flex items-center justify-center gap-3">
            <Mail size={20} className="text-[var(--accent-primary)]" />
            <a 
              href="mailto:rickypcyt3@gmail.com" 
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors hover:underline"
            >
              rickypcyt@gmail.com
            </a>
            {/* Github contact, uncomment and set your repo if needed */}
            {/* <Github size={20} className="text-[var(--accent-primary)] ml-4" />
            <a
              href="https://github.com/tuusuario/tu-repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors hover:underline"
            >
              Github
            </a> */}
          </div>
        </div>
        {/* Thanks */}
        <div className="w-full max-w-xl text-center">
          <p className="text-base text-[var(--text-secondary)]">
            Thank you for using Uni Tracker! Your support and feedback help make this app better every day.
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

export default AboutModal; 