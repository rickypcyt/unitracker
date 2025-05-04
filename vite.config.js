import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

import path from "path";


export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@chakra-ui/react',
      '@chakra-ui/react/modal',
      '@chakra-ui/react/button'
    ]
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase the warning limit to 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@chakra-ui/react', 'framer-motion'],
          'vendor-utils': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-dnd': ['react-beautiful-dnd'],
          'vendor-icons': ['lucide-react'],
          'vendor-toast': ['react-toastify']
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});