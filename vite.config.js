import { compression } from 'vite-plugin-compression2';
import { defineConfig } from 'vite'
import path from "path";
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ command, mode }) => {
  // Disable compression for mobile builds to avoid duplicate resource issues in Android
  const shouldDisableCompression = process.env.DISABLE_COMPRESSION === 'true' ||
                                  process.env.CAPACITOR_PLATFORM ||
                                  process.argv.some(arg => arg.includes('cap'));
  
  return {
    plugins: [
      react(),
      // Only enable compression for web builds, not mobile builds
      ...(!shouldDisableCompression ? [
        compression({
          algorithm: 'gzip',
          exclude: [/\.(br)$/, /\.(gz)$/],
        }),
        compression({
          algorithm: 'brotliCompress',
          exclude: [/\.(br)$/, /\.(gz)$/],
        }),
      ] : []),
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
    },
    force: false // Solo forzar cuando sea necesario
  },
  // Cache configuration
  cacheDir: 'node_modules/.vite',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para mejor caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@chakra-ui/react', 'framer-motion'],
          'utils-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/postgrest-js']
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: mode === 'development',
    cssMinify: true,
    minify: 'esbuild', // esbuild es más rápido que terser
    reportCompressedSize: false, // Desactivar para builds más rápidos
    chunkSizeWarningLimit: 1000
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
};
});