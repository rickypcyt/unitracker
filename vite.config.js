import { compression } from 'vite-plugin-compression2';
import { defineConfig, loadEnv } from 'vite';
import path from "path";
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
  // Load env vars from .env files for server-side use (proxy middleware)
  loadEnv(mode, process.cwd(), '');

  // Disable compression for mobile builds
  const shouldDisableCompression = process.env.DISABLE_COMPRESSION === 'true' ||
                                  process.env.CAPACITOR_PLATFORM ||
                                  process.argv.some(arg => arg.includes('cap'));
  
  const isDev = command === 'serve';
  const isFastDev = process.env.FAST_DEV === 'true';
  
  return {
    plugins: [
      react(),
      // PWA - disabled for mobile (Capacitor) and fast dev builds
      ...(!shouldDisableCompression && !isFastDev ? [
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: [
            'assets/favicon.ico',
            'assets/apple-touch-icon-removebg-preview.png',
            'assets/android-chrome-192x192.png',
            'assets/android-chrome-512x512.png',
          ],
          manifest: {
            name: 'UniTracker 2026 - Study & Task Management',
            short_name: 'UniTracker',
            description: 'Free study app with Pomodoro timer, task management, and progress tracking for students.',
            theme_color: '#0A84FF',
            background_color: '#000000',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/assets/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/assets/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: '/assets/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            // Don't cache Supabase API calls or large chunks
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [
              /^\/api\//,
              /^https:\/\/.*\.supabase\.co\//,
            ],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\//,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60, // 1 hour
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images',
                  expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                },
              },
              {
                urlPattern: /\.(?:js|css|woff2?)$/,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'static-resources',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                  },
                },
              },
            ],
          },
          devOptions: {
            enabled: false,
          },
        }),
      ] : []),
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
      minify: 'terser',
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
      proxy: {
        '/api/openrouter': {
          target: 'http://localhost:5173',
          configure: (server) => {
            server.middlewares.use('/api/openrouter', async (req, res) => {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const parsed = JSON.parse(body);
                  const apiKey = process.env.OPENROUTER_API_KEY;
                  if (!apiKey) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'OPENROUTER_API_KEY not set in .env.local' }));
                    return;
                  }
                  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${apiKey}`,
                      'HTTP-Referer': 'http://localhost:5173',
                    },
                    body: JSON.stringify({
                      model: parsed.model,
                      messages: parsed.messages,
                      temperature: parsed.temperature ?? 0.0,
                      stream: parsed.stream ?? false,
                    }),
                  });
                  const data = await response.text();
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(data);
                } catch (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            });
          },
        },
      },
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
