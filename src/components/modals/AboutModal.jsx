import React from 'react';
import { X, Mail, Github } from 'lucide-react';

const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">About Uni Tracker</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 text-neutral-300">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">The Story</h3>
            <p className="leading-relaxed">
              Uni Tracker was born in December 2024 from a simple idea: to create a better way to manage university assignments and tasks. As a student myself, I noticed the need for a tool that could help organize academic work more effectively while being intuitive and user-friendly.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">About Me</h3>
            <p className="leading-relaxed">
              Hi! I'm Ricky, the creator of Uni Tracker. I'm passionate about building tools that make life easier for students. This project represents my commitment to improving the academic experience through technology.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Get in Touch</h3>
            <p className="leading-relaxed mb-4">
              I'm always open to feedback, suggestions, or just a friendly chat about the app. Whether you've found a bug, have a feature request, or want to share your experience, I'd love to hear from you!
            </p>
            <div className="flex items-center gap-2 text-accent-primary hover:text-accent-primary/80 transition-colors">
              <Mail size={20} />
              <a href="mailto:rickypcyt3@gmail.com" className="hover:underline">
                rickypcyt@gmail.com
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <p className="text-sm text-neutral-400">
              Thank you for using Uni Tracker! Your support and feedback help make this app better every day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal; 