import { compression } from 'vite-plugin-compression2';
import { defineConfig } from 'vite'
import path from "path";
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
  ],
  optimizeDeps: {
    include: [
      '@chakra-ui/react',
      '@chakra-ui/react/modal',
      '@chakra-ui/react/button',
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'framer-motion',
      'react-toastify',
      'lucide-react',
      '@supabase/supabase-js',
      '@supabase/postgrest-js'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    sourcemap: true,
    cssMinify: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ['@supabase/supabase-js', '@supabase/postgrest-js']
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['.ngrok-free.app'],
    watch: {
      usePolling: false,
      interval: 100
    }
  },
  preview: {
    port: 3000,
    host: true
  }
});