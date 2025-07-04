import { Info, LogIn, LogOut, Menu, Settings, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import AboutModal from '@/modals/AboutModal';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/navbar/NavigationContext';

const Navbar = ({ onOpenSettings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const { isLoggedIn, loginWithGoogle, logout } = useAuth();
  const { activePage, navigateTo } = useNavigation();
  const settingsRef = useRef(null);

  const isActive = (page) => {
    return activePage === page;
  };

  const navLinkClass = (page) => {
    return `px-4 py-2 rounded-md text-xl ${
      isActive(page)
        ? 'text-[var(--accent-primary)] '
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
    }`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-50">
        <div className="w-full px-2">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-[var(--text-primary)] font-bold text-2xl">Uni</span>
              <span className="text-[var(--accent-primary)] font-bold text-2xl">Tracker</span>
            </div>

            {/* Enlaces de navegación - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => navigateTo('tasks')} className={navLinkClass('tasks')}>
                Tasks
              </button>
              <button onClick={() => navigateTo('calendar')} className={navLinkClass('calendar')}>
                Calendar
              </button>
              <button onClick={() => navigateTo('session')} className={navLinkClass('session')}>
                Session
              </button>
              <button onClick={() => navigateTo('notes')} className={navLinkClass('notes')}>
                Notes
              </button>
              <button onClick={() => navigateTo('stats')} className={navLinkClass('stats')}>
                Statistics
              </button>
            </div>

            {/* Settings Menu - Desktop */}
            <div className="hidden md:block relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors"
              >
                <Settings size={22} />
              </button>
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg z-50 border border-[var(--border-primary)]">
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowAbout(true);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                  >
                    <Info size={16} />
                    About
                  </button>
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        logout();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        loginWithGoogle();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                    >
                      <LogIn size={16} />
                      Log In
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Botón de menú móvil */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden absolute w-full bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
            <div className="px-2 pt-2 pb-2 space-y-1 flex flex-col items-center">
              <button onClick={() => {
                navigateTo('tasks');
                setIsMenuOpen(false);
              }} className={navLinkClass('tasks')}>
                Tasks
              </button>
              <button onClick={() => {
                navigateTo('calendar');
                setIsMenuOpen(false);
              }} className={navLinkClass('calendar')}>
                Calendar
              </button>
              <button onClick={() => {
                navigateTo('session');
                setIsMenuOpen(false);
              }} className={navLinkClass('session')}>
                Session
              </button>
              <button onClick={() => {
                navigateTo('notes');
                setIsMenuOpen(false);
              }} className={navLinkClass('notes')}>
                Notes
              </button>
              <button onClick={() => {
                navigateTo('stats');
                setIsMenuOpen(false);
              }} className={navLinkClass('stats')}>
                Statistics
              </button>
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMenuOpen(false);
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2 rounded-md text-xl font-medium"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setShowAbout(true);
                  setIsMenuOpen(false);
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2 rounded-md text-xl font-medium"
              >
                About
              </button>
            </div>
          </div>
        )}
      </nav>

      {showAbout && (
        <AboutModal
          isOpen={showAbout}
          onClose={() => setShowAbout(false)}
        />
      )}
    </>
  );
};

export default Navbar; 