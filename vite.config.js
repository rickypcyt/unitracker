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
        manualChunks: (id) => {
          // Separar vendor chunks para mejor caching y carga paralela
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@chakra-ui')) {
              return 'chakra-core';
            }
            if (id.includes('framer-motion')) {
              return 'motion-vendor';
            }
            if (id.includes('@emotion')) {
              return 'emotion-vendor';
            }
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('zustand')) {
              return 'utils-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            if (id.includes('lucide-react') || id.includes('@heroicons/react')) {
              return 'icon-vendor';
            }
            // Group toast notifications together
            if (id.includes('react-toastify') || id.includes('react-hot-toast') || id.includes('sonner')) {
              return 'toast-vendor';
            }
          }

          // Split large application chunks
          if (id.includes('src/modals/LoginPromptModal')) {
            return 'auth-modal';
          }
          if (id.includes('src/pages/session/StudyTimer')) {
            return 'study-timer';
          }
          if (id.includes('src/pages/notes/')) {
            return 'notes-page';
          }
          if (id.includes('src/pages/tasks/')) {
            return 'tasks-page';
          }
          if (id.includes('src/pages/calendar/')) {
            return 'calendar-page';
          }
          if (id.includes('src/pages/stats/')) {
            return 'stats-page';
          }
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