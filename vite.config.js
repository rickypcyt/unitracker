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
      '@emotion/react',
      '@emotion/styled',
      'react',
      'react-dom',
      'react-dom/client',
      'react-redux',
      '@reduxjs/toolkit',
      'framer-motion',
      'react-toastify',
      'lucide-react',
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-placeholder'
    ],
    esbuildOptions: {
      target: 'es2020',
      // This helps with circular dependencies
      define: {
        global: 'globalThis',
      },
    },
    force: false // Remove force optimization to prevent initialization issues
  },
  // Cache configuration
  cacheDir: 'node_modules/.vite',
  build: {
    target: ['es2020', 'firefox91'],
    chunkSizeWarningLimit: 600,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group all React and Emotion related code together to prevent initialization issues
          if (id.includes('node_modules')) {
            // Core React and React DOM must be together
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            // Emotion and its dependencies - ensure proper order
            if (id.includes('@emotion/react') || id.includes('@emotion/styled') || id.includes('@emotion/cache')) {
              return 'emotion-vendor';
            }
            // Babel runtime helpers (often used with Emotion)
            if (id.includes('@babel/runtime/helpers/')) {
              return 'emotion-vendor';
            }
            // Chakra UI and its dependencies
            if (id.includes('@chakra-ui')) {
              return 'chakra-core';
            }
            // Animation libraries
            if (id.includes('framer-motion') || id.includes('popmotion')) {
              return 'motion-vendor';
            }
            // State management
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('zustand')) {
              return 'utils-vendor';
            }
            // Database
            if (id.includes('@supabase') || id.includes('postgrest-js')) {
              return 'supabase-vendor';
            }
            // Charting libraries
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
              return 'chart-vendor';
            }
            // Date handling
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Icons
            if (id.includes('lucide-react') || id.includes('@heroicons/react')) {
              return 'icon-vendor';
            }
            // Toast notifications
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
          if (id.includes('src/pages/notes/') && !id.includes('MarkdownWysiwyg')) {
            return 'notes-page';
          }
          if (id.includes('src/MarkdownWysiwyg') || id.includes('@tiptap/')) {
            return 'tiptap-editor';
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
    dedupe: ['@supabase/supabase-js', '@supabase/postgrest-js'],
    // Ensure Emotion modules are resolved correctly
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
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