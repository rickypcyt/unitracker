import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLocation, Link } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, loginWithGoogle, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    return `px-3 py-1 rounded-md text-xl font-medium ${
      isActive(path)
        ? 'text-blue-500'
        : 'text-gray-300 hover:text-white'
    }`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black border-b border-neutral-800 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-white font-bold text-xl">Uni</span>
            <span className="text-blue-500 font-bold text-xl">Tracker</span>
          </div>

          {/* Enlaces de navegación - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/tasks" className={navLinkClass('/tasks')}>
              Tasks
            </Link>
            <Link to="/" className={navLinkClass('/')}>
              Session
            </Link>
            <Link to="/calendar" className={navLinkClass('/calendar')}>
              Calendar
            </Link>
            <Link to="/stats" className={navLinkClass('/stats')}>
              Statistics
            </Link>
          </div>

          {/* Login/Logout - Desktop */}
          <div className="hidden md:block">
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="text-gray-300 hover:text-white px-3 py-1 rounded-md text-xl font-medium"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="text-gray-300 hover:text-white px-3 py-1 rounded-md text-xl font-medium"
              >
                Login
              </button>
            )}
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden absolute w-full bg-black border-b border-neutral-800">
          <div className="px-2 pt-2 pb-2 space-y-1 flex flex-col items-center">
            <Link to="/tasks" className={navLinkClass('/tasks')}>
              Tasks
            </Link>
            <Link to="/" className={navLinkClass('/')}>
              Session
            </Link>
            <Link to="/calendar" className={navLinkClass('/calendar')}>
              Calendar
            </Link>
            <Link to="/stats" className={navLinkClass('/stats')}>
              Statistics
            </Link>
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="text-gray-300 hover:text-white px-3 py-1 rounded-md text-xl font-medium"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="text-gray-300 hover:text-white px-3 py-1 rounded-md text-xl font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 