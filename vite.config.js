import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path";
import { compression } from 'vite-plugin-compression2';

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
      target: 'esnext'
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@chakra-ui/react', 'framer-motion'],
          'vendor-utils': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-dnd': ['react-beautiful-dnd'],
          'vendor-icons': ['lucide-react'],
          'vendor-toast': ['react-toastify'],
          'vendor-supabase': ['@supabase/supabase-js', '@supabase/postgrest-js']
        },
        // Optimize chunk loading
        experimentalMinChunkSize: 20000,
        // Add content hash to file names
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    // Enable source maps in production
    sourcemap: true,
    // Minify CSS
    cssMinify: true,
    // Minify JavaScript
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
    // Enable HMR
    hmr: true,
    // Optimize dev server
    watch: {
      usePolling: false,
      interval: 100
    },
    // Configure history fallback
    historyApiFallback: true
  },
  preview: {
    // Configure history fallback for preview server
    historyApiFallback: true
  }
});