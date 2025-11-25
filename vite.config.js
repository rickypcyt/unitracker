import { compression } from 'vite-plugin-compression2';
import { defineConfig } from 'vite'
import path from "path";
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
  // Disable compression for mobile builds to avoid duplicate resource issues in Android
  const shouldDisableCompression = process.env.DISABLE_COMPRESSION === 'true' ||
                                  process.env.CAPACITOR_PLATFORM ||
                                  process.argv.some(arg => arg.includes('cap'));
  
  return {
    plugins: [
      react(),
      // Bundle analyzer solo cuando se solicita explícitamente
      ...(process.env.ANALYZE === 'true' ? [
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        })
      ] : []),
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
    target: ['es2020', 'firefox91'], // Firefox 91+ soporta características modernas
    chunkSizeWarningLimit: 600, // Reducir para forzar mejor splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para mejor caching y carga paralela
          'react-vendor': ['react', 'react-dom'],
          // Split large UI library into smaller chunks
          'chakra-core': ['@chakra-ui/react'],
          'motion-vendor': ['framer-motion'],
          'emotion-vendor': ['@emotion/react', '@emotion/styled'],
          'utils-vendor': ['@reduxjs/toolkit', 'react-redux', 'zustand'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts'],
          // @tiptap/pm tiene problemas de resolución, dejar que Rollup lo maneje automáticamente
          // Split large utilities
          'date-vendor': ['date-fns'],
          'icon-vendor': ['lucide-react', '@heroicons/react']
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: mode === 'development',
    cssMinify: true,
    minify: mode === 'development' ? false : 'terser', // Usar terser en producción para mejor compresión
    reportCompressedSize: false,
    // Optimizaciones específicas para Firefox
    modulePreload: {
      polyfill: false // Firefox no necesita polyfill para modulePreload
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
};
});