import { Cloud, Database, Lock, Rocket, Users, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from '@/hooks/auth/useAuth';

interface EnhancedLoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

const EnhancedLoginModal: React.FC<EnhancedLoginModalProps> = ({ onClose, onLogin }) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { loginWithGoogle } = useAuth();

  // Close only on Escape — clicks outside must not dismiss onboarding modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);

    // Trigger animation on mount
    setTimeout(() => setIsAnimating(true), 100);

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    // On success the browser redirects to Google — no need to close.
    // On failure we keep the modal open so the error toast is visible.
    const ok = await loginWithGoogle();
    if (ok) {
      onLogin();
      onClose();
    } else {
      setIsLoggingIn(false);
    }
  };

  const benefits = [
    { icon: Cloud, title: t('auth.login.cloudTitle'), description: t('auth.login.cloudDesc') },
    { icon: Database, title: t('auth.login.secureTitle'), description: t('auth.login.secureDesc') },
    { icon: Users, title: t('auth.login.crossTitle'), description: t('auth.login.crossDesc') },
    { icon: Rocket, title: t('auth.login.realtimeTitle'), description: t('auth.login.realtimeDesc') }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div
        ref={modalRef}
        className={`bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl border-2 border-[var(--border-primary)]/50 w-full max-w-2xl mx-1 sm:mx-2 md:mx-4 p-4 sm:p-6 md:p-8 relative shadow-2xl overflow-hidden transition-all duration-700 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } max-h-[calc(100dvh-1.5rem)] overflow-y-auto`}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-primary)]/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-3 sm:p-2 rounded-full bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)]"
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </button>
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-4 sm:mb-6 relative z-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 px-8 text-center">
            {t('auth.login.title')}
          </h2>

          <p className="hidden sm:block text-base text-[var(--text-secondary)] text-center leading-relaxed max-w-lg">
            {t('auth.login.subtitle')}
          </p>
        </div>
        
        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 relative z-10">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 sm:p-4 text-center sm:text-left rounded-xl bg-[var(--bg-secondary)]/30 border-2 border-[var(--border-primary)]/30"
            >
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center">
                <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-primary)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] sm:mb-1">
                  {benefit.title}
                </h3>
                <p className="hidden sm:block text-sm text-[var(--text-secondary)]">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Supabase Info Section */}
        <div className="mb-4 sm:mb-6 relative z-10">
          <div className="bg-[var(--bg-secondary)]/20 rounded-xl p-3 sm:p-5 border-2 border-[var(--border-primary)]/30">
            <div className="flex items-center gap-3 sm:mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{t('auth.login.poweredBy')}</h3>
                <p className="hidden sm:block text-sm text-[var(--text-secondary)]">{t('auth.login.poweredByDesc')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full group px-4 sm:px-6 py-3 sm:py-4 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-60"
          >
            {isLoggingIn ? t('auth.login.redirecting') : t('auth.login.signInGoogle')}
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-[var(--bg-secondary)]/30 text-[var(--text-primary)] rounded-xl sm:rounded-2xl border-2 border-[var(--border-primary)]/30 font-medium"
          >
            {t('auth.login.lookAround')}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-3 sm:mt-4 text-center relative z-10">
          <p className="text-xs text-[var(--text-secondary)]">
            <Lock className="w-3 h-3 inline mr-1" />
            {t('auth.login.privacy')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginModal;
