import { compression } from 'vite-plugin-compression2';
import { defineConfig, loadEnv } from 'vite';
import path from "path";
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import fs from 'fs';
import { SEO_PAGES, SITE } from './src/pages/landing/seoPages.ts';

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// Writes dist/<slug>/index.html for each SEO page with real title, meta tags
// and body text so crawlers see content without running JavaScript.
const seoPrerenderPlugin = {
  name: 'seo-prerender',
  apply: 'build',
  closeBundle() {
    const base = path.resolve(process.cwd(), 'dist');
    const tpl = path.join(base, 'index.html');
    if (!fs.existsSync(tpl)) return;
    const html = fs.readFileSync(tpl, 'utf-8');
    for (const p of SEO_PAGES) {
      const url = `${SITE}/${p.slug}`;
      let out = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)}</title>`)
        .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(p.description)}" />`)
        .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
        .replace(/<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
        .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(p.title)}" />`)
        .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(p.description)}" />`);
      const body =
        `<main><h1>${esc(p.h1)}</h1><p>${esc(p.intro)}</p>` +
        p.sections.map((s) => `<section><h2>${esc(s.heading)}</h2><p>${esc(s.body)}</p></section>`).join('') +
        p.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('') +
        `</main>`;
      out = out.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
      const dir = path.join(base, p.slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), out);
    }
    // Existing localized landings: correct title/description/canonical in static HTML
    const extra = [
      { slug: 'es', title: 'UniTracker - Temporizador Pomodoro y Gestor de Tareas Gratis | Open Source', description: 'Temporizador Pomodoro, gestor de tareas, calendario y analíticas de estudio gratis en una app open source. Funciona offline, sincroniza al volver. Sin anuncios ni suscripciones.' },
      { slug: 'hi', title: 'UniTracker - Free Pomodoro Timer और Task Manager | Open Source', description: 'एक open source app में free Pomodoro timer, task manager, calendar और study analytics। Offline चलता है, reconnect पर sync होता है। No ads, no subscriptions।' },
      { slug: 'india', title: 'UniTracker India - Free Study App for JEE, NEET & CBSE | Pomodoro Timer', description: 'Free study app for students in India preparing for JEE, NEET, CBSE boards and university exams. Pomodoro timer, tasks, calendar & analytics. No ads, works offline.' },
    ];
    for (const p of extra) {
      const url = `${SITE}/${p.slug}`;
      const out = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)}</title>`)
        .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(p.description)}" />`)
        .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
        .replace(/<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
        .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(p.title)}" />`)
        .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(p.description)}" />`);
      const dir = path.join(base, p.slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), out);
    }
  },
};

export default defineConfig(({ command, mode }) => {
  // Load env vars from .env files for server-side use (dev middleware)
  const env = loadEnv(mode, process.cwd(), '');

  // Dev-only middleware that proxies /api/openrouter to OpenRouter
  const openRouterDevPlugin = {
    name: 'openrouter-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/openrouter', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const apiKey = env.OPENROUTER_API_KEY;
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
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
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };

  // Dev-only middleware that runs api/send-email.ts (Vercel function) locally
  const sendEmailDevPlugin = {
    name: 'send-email-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/send-email', (req, res) => {
        const sendJson = (status, data) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };
        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', async () => {
          try {
            // Expose .env.local values (RESEND_API_KEY, SUPABASE_*, ADMIN_EMAIL...) to the handler
            for (const [k, v] of Object.entries(env)) {
              if (process.env[k] === undefined) process.env[k] = v;
            }
            const mod = await server.ssrLoadModule('/api/send-email.ts');
            const vercelRes = {
              status(code) { res.statusCode = code; return vercelRes; },
              json: (data) => sendJson(res.statusCode || 200, data),
              send: (data) => res.end(data),
            };
            await mod.default(
              { method: req.method, headers: req.headers, body: raw ? JSON.parse(raw) : {} },
              vercelRes,
            );
          } catch (err) {
            sendJson(500, { error: err instanceof Error ? err.message : 'Internal error' });
          }
        });
      });
    },
  };

  // Disable compression for mobile builds
  const shouldDisableCompression = process.env.DISABLE_COMPRESSION === 'true' ||
                                  process.env.CAPACITOR_PLATFORM ||
                                  process.argv.some(arg => arg.includes('cap'));
  
  const isDev = command === 'serve';
  const isFastDev = process.env.FAST_DEV === 'true';
  const isReleaseBuild = mode === 'release';
  
  return {
    plugins: [
      ...(command === 'serve' ? [openRouterDevPlugin, sendEmailDevPlugin] : []),
      react(),
      seoPrerenderPlugin,
      // Keep the PWA virtual module available, but skip Workbox generation for fast/mobile builds.
      VitePWA({
          disable: shouldDisableCompression || isFastDev,
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
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
            enabled: true,
            suppressWarnings: true,
          },
        }),
      // Bundle analyzer solo cuando se solicita explícitamente
      ...(process.env.ANALYZE === 'true' ? [
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        })
      ] : []),
      // Compression is reserved for release builds because gzip + Brotli are expensive locally.
      ...(isReleaseBuild && !shouldDisableCompression ? [
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
        'react',
        'react-dom',
        'react-dom/client',
        'react-redux',
        '@reduxjs/toolkit',
        'framer-motion',
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
      sourcemap: isReleaseBuild,
      cssMinify: true,
      minify: isReleaseBuild ? 'terser' : 'esbuild',
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
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      include: ['src/**/*.test.{ts,tsx}'],
    }
  };
});
