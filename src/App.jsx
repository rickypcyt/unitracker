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