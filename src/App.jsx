import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from './utils/supabaseClient';

function App() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    toast.dismiss();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseWelcome();
    }
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <Router>
      <div className="min-h-screen bg-bg-primary">
        <AnimatePresence>
          {showWelcomeModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
              onClick={handleOverlayClick}
            >
              <div className="maincard max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-center flex-1 text-accent-primary">
                    Welcome to UniTracker
                  </h3>
                  <button
                    className="text-gray-400 hover:text-white transition duration-200"
                    onClick={handleCloseWelcome}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4 text-text-primary">
                  <p className="text-lg text-center">
                    This is a time management tool for those who like to study and work and have a record of how many hours they spend doing it.
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-accent-primary">Key Features:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Task Management: Create, track, and organize your study tasks</li>
                      <li>Study Timer: Track your study sessions with a built-in timer</li>
                      <li>Pomodoro Technique: Built-in Pomodoro timer for focused study sessions</li>
                      <li>Progress Tracking: Visualize your study progress and statistics</li>
                      <li>Calendar Integration: Plan and view your study schedule</li>
                      <li>Noise Generator: Background sounds to help you focus</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-accent-primary">Data Storage:</h4>
                    <p>
                      All your data is securely stored in a database, ensuring your progress and tasks are always saved and accessible across devices.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-accent-primary">Built with:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>React for the frontend</li>
                      <li>Tailwind CSS for styling</li>
                      <li>Chakra UI for components</li>
                      <li>Supabase for database and authentication</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          containerId="main-toast-container"
          enableMultiContainer
        />
      </div>
    </Router>
  );
}

export default App; 