import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  useEffect(() => {
    // Clean up any existing toasts when the app loads
    toast.dismiss();
  }, []);

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