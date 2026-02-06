import { compression } from 'vite-plugin-compression2';
import { defineConfig } from 'vite';
import path from "path";
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
  // Disable compression for mobile builds
  const shouldDisableCompression = process.env.DISABLE_COMPRESSION === 'true' ||
                                  process.env.CAPACITOR_PLATFORM ||
                                  process.argv.some(arg => arg.includes('cap'));
  
  const isDev = command === 'serve';
  const isFastDev = process.env.FAST_DEV === 'true';
  
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
      ...(!shouldDisableCompression && !isFastDev ? [
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
        '@tiptap/extension-placeholder',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@dayflow/core'
      ],
      exclude: [
        'chart.js'
      ],
      ...(isDev && !isFastDev && {
        esbuildOptions: {
          target: 'es2020',
          define: {
            global: 'globalThis',
          },
        },
      }),
    },
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
            // Ensure React, React DOM, and JSX runtimes live together for stable exports
            if (id.includes('node_modules')) {
              if (
                id.includes('react/jsx-runtime') ||
                id.includes('react/jsx-dev-runtime') ||
                id.includes('react-dom') ||
                id.includes('scheduler') ||
                // match '/react/' but avoid matching unrelated packages with 'react' in path segments
                /[\\/]node_modules[\\/](react)[\\/]/.test(id)
              ) {
                return 'react-vendor';
              }
            }
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      sourcemap: true,
      cssMinify: true,
      minify: false,
      reportCompressedSize: false,
      modulePreload: {
        polyfill: false
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      dedupe: ['react', 'react-dom', '@supabase/supabase-js', '@supabase/postgrest-js'],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: ['.ngrok-free.app'],
      watch: {
        usePolling: false,
        interval: 50,
        ignored: ['**/node_modules/**', '**/dist/**']
      },
      hmr: {
        port: 5173,
        host: 'localhost',
        overlay: false,
      },
      fs: {
        strict: false,
      }
    },
    preview: {
      port: 3000,
      host: true
    }
  };
});
