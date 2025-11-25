import { Cloud, Database, Globe, Lock, Rocket, Users, X, Zap } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useAuth } from '@/hooks/useAuth';

interface EnhancedLoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

const EnhancedLoginModal: React.FC<EnhancedLoginModalProps> = ({ onClose, onLogin }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { loginWithGoogle } = useAuth();

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    
    // Trigger animation on mount
    setTimeout(() => setIsAnimating(true), 100);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleLogin = () => {
    loginWithGoogle();
    onLogin();
    onClose();
  };

  const benefits = [
    {
      icon: Cloud,
      title: "Cloud Sync",
      description: "Access your data from anywhere, on any device"
    },
    {
      icon: Database,
      title: "Secure Storage",
      description: "Your data is safely stored and encrypted"
    },
    {
      icon: Users,
      title: "Cross-Device",
      description: "Seamlessly sync between phone, tablet, and computer"
    },
    {
      icon: Rocket,
      title: "Real-time Updates",
      description: "Instant sync across all your devices"
    }
  ];

  const companies = [
    { name: "Netflix", logo: "🎬" },
    { name: "Spotify", logo: "🎵" },
    { name: "GitHub", logo: "💻" },
    { name: "Shopify", logo: "🛒" },
    { name: "Figma", logo: "🎨" },
    { name: "Vercel", logo: "⚡" }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div
        ref={modalRef}
        className={`bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl border border-[var(--border-primary)]/50 w-full max-w-2xl mx-1 sm:mx-2 md:mx-4 p-4 sm:p-6 md:p-8 relative shadow-2xl overflow-hidden transition-all duration-700 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-primary)]/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-3 sm:p-2 rounded-full bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 group active:scale-95"
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform duration-200" />
        </button>
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-4 sm:mb-6 relative z-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 text-center">
            Unlock Your Full Potential
          </h2>
          
          <p className="text-sm sm:text-base text-[var(--text-secondary)] text-center leading-relaxed px-3 sm:px-0 max-w-lg">
            Sign in to sync your data across devices and unlock powerful features that will transform your productivity
          </p>
        </div>
        
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 relative z-10">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/30 hover:border-[var(--accent-primary)]/30 transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-primary)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] mb-1">
                  {benefit.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Supabase Info Section */}
        <div className="mb-4 sm:mb-6 relative z-10">
          <div className="bg-[var(--bg-secondary)]/20 rounded-xl p-4 sm:p-5 border border-[var(--border-primary)]/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Powered by Supabase OAuth</h3>
                <p className="text-sm text-[var(--text-secondary)]">Enterprise-grade authentication trusted by thousands</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-primary)]/50 rounded-full border border-[var(--border-primary)]/30">
                <Lock className="w-3 h-3 text-[var(--accent-primary)]" />
                <span className="text-xs text-[var(--text-primary)]">Secure</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-primary)]/50 rounded-full border border-[var(--border-primary)]/30">
                <Zap className="w-3 h-3 text-[var(--accent-primary)]" />
                <span className="text-xs text-[var(--text-primary)]">Fast</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-primary)]/50 rounded-full border border-[var(--border-primary)]/30">
                <Globe className="w-3 h-3 text-[var(--accent-primary)]" />
                <span className="text-xs text-[var(--text-primary)]">Global</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-[var(--text-secondary)] mb-2">Trusted by leading companies worldwide:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {companies.map((company, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-primary)]/50 rounded-lg border border-[var(--border-primary)]/30"
                    title={company.name}
                  >
                    <span className="text-sm">{company.logo}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{company.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
          <button
            onClick={handleLogin}
            className="w-full group px-4 sm:px-6 py-3 sm:py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl"
          >
            Sign in with Google
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 text-[var(--text-primary)] rounded-xl sm:rounded-2xl border border-[var(--border-primary)]/30 hover:border-[var(--border-primary)]/50 transition-all duration-300 font-medium"
          >
            Let me look around first
          </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-3 sm:mt-4 text-center relative z-10">
          <p className="text-xs text-[var(--text-secondary)]">
            <Lock className="w-3 h-3 inline mr-1" />
            Your data is private and secure. We never share your information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginModal;
