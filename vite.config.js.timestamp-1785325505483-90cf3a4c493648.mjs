// vite.config.js
import { compression } from "file:///C:/coding/unitracker/node_modules/vite-plugin-compression2/dist/index.mjs";
import { defineConfig } from "file:///C:/coding/unitracker/node_modules/vite/dist/node/index.js";
import path from "path";
import react from "file:///C:/coding/unitracker/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/coding/unitracker/node_modules/vite-plugin-pwa/dist/index.js";
import { visualizer } from "file:///C:/coding/unitracker/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "C:\\coding\\unitracker";
var vite_config_default = defineConfig(({ command, mode }) => {
  const shouldDisableCompression = process.env.DISABLE_COMPRESSION === "true" || process.env.CAPACITOR_PLATFORM || process.argv.some((arg) => arg.includes("cap"));
  const isDev = command === "serve";
  const isFastDev = process.env.FAST_DEV === "true";
  return {
    plugins: [
      react(),
      // PWA - disabled for mobile (Capacitor) and fast dev builds
      ...!shouldDisableCompression && !isFastDev ? [
        VitePWA({
          registerType: "autoUpdate",
          includeAssets: [
            "assets/favicon.ico",
            "assets/apple-touch-icon-removebg-preview.png",
            "assets/android-chrome-192x192.png",
            "assets/android-chrome-512x512.png"
          ],
          manifest: {
            name: "UniTracker 2026 - Study & Task Management",
            short_name: "UniTracker",
            description: "Free study app with Pomodoro timer, task management, and progress tracking for students.",
            theme_color: "#0A84FF",
            background_color: "#000000",
            display: "standalone",
            orientation: "portrait-primary",
            scope: "/",
            start_url: "/",
            icons: [
              {
                src: "/assets/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png"
              },
              {
                src: "/assets/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png"
              },
              {
                src: "/assets/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable"
              }
            ]
          },
          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
            // Don't cache Supabase API calls or large chunks
            navigateFallback: "/index.html",
            navigateFallbackDenylist: [
              /^\/api\//,
              /^https:\/\/.*\.supabase\.co\//
            ],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\//,
                handler: "NetworkFirst",
                options: {
                  cacheName: "supabase-api",
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60
                    // 1 hour
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
                handler: "CacheFirst",
                options: {
                  cacheName: "images",
                  expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24 * 30
                    // 30 days
                  }
                }
              },
              {
                urlPattern: /\.(?:js|css|woff2?)$/,
                handler: "StaleWhileRevalidate",
                options: {
                  cacheName: "static-resources",
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 7
                    // 7 days
                  }
                }
              }
            ]
          },
          devOptions: {
            enabled: false
          }
        })
      ] : [],
      // Bundle analyzer solo cuando se solicita explícitamente
      ...process.env.ANALYZE === "true" ? [
        visualizer({
          filename: "dist/stats.html",
          open: true,
          gzipSize: true,
          brotliSize: true
        })
      ] : [],
      // Only enable compression for web builds, not mobile builds
      ...!shouldDisableCompression && !isFastDev ? [
        compression({
          algorithm: "gzip",
          exclude: [/\.(br)$/, /\.(gz)$/]
        }),
        compression({
          algorithm: "brotliCompress",
          exclude: [/\.(br)$/, /\.(gz)$/]
        })
      ] : []
    ],
    optimizeDeps: {
      include: [
        "@chakra-ui/react",
        "@emotion/react",
        "@emotion/styled",
        "react",
        "react-dom",
        "react-dom/client",
        "react-redux",
        "@reduxjs/toolkit",
        "framer-motion",
        "react-toastify",
        "lucide-react",
        "@supabase/supabase-js",
        "@supabase/postgrest-js",
        "@tiptap/react",
        "@tiptap/starter-kit",
        "@tiptap/extension-placeholder",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@dayflow/core"
      ],
      exclude: [
        "chart.js"
      ],
      ...isDev && !isFastDev && {
        esbuildOptions: {
          target: "es2020",
          define: {
            global: "globalThis"
          }
        }
      }
    },
    build: {
      target: ["es2020", "firefox91"],
      chunkSizeWarningLimit: 600,
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/]
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react/jsx-runtime") || id.includes("react/jsx-dev-runtime") || id.includes("react-dom") || id.includes("scheduler") || // match '/react/' but avoid matching unrelated packages with 'react' in path segments
              /[\\/]node_modules[\\/](react)[\\/]/.test(id)) {
                return "react-vendor";
              }
            }
          },
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]"
        }
      },
      sourcemap: true,
      cssMinify: true,
      minify: "terser",
      reportCompressedSize: false,
      modulePreload: {
        polyfill: false
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src")
      },
      dedupe: ["react", "react-dom", "@supabase/supabase-js", "@supabase/postgrest-js"],
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"]
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      allowedHosts: [".ngrok-free.app"],
      watch: {
        usePolling: false,
        interval: 50,
        ignored: ["**/node_modules/**", "**/dist/**"]
      },
      hmr: {
        port: 5173,
        host: "localhost",
        overlay: false
      },
      fs: {
        strict: false
      }
    },
    preview: {
      port: 3e3,
      host: true
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxjb2RpbmdcXFxcdW5pdHJhY2tlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcY29kaW5nXFxcXHVuaXRyYWNrZXJcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L2NvZGluZy91bml0cmFja2VyL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgY29tcHJlc3Npb24gfSBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbjInO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XHJcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQsIG1vZGUgfSkgPT4ge1xyXG4gIC8vIERpc2FibGUgY29tcHJlc3Npb24gZm9yIG1vYmlsZSBidWlsZHNcclxuICBjb25zdCBzaG91bGREaXNhYmxlQ29tcHJlc3Npb24gPSBwcm9jZXNzLmVudi5ESVNBQkxFX0NPTVBSRVNTSU9OID09PSAndHJ1ZScgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LkNBUEFDSVRPUl9QTEFURk9STSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5hcmd2LnNvbWUoYXJnID0+IGFyZy5pbmNsdWRlcygnY2FwJykpO1xyXG4gIFxyXG4gIGNvbnN0IGlzRGV2ID0gY29tbWFuZCA9PT0gJ3NlcnZlJztcclxuICBjb25zdCBpc0Zhc3REZXYgPSBwcm9jZXNzLmVudi5GQVNUX0RFViA9PT0gJ3RydWUnO1xyXG4gIFxyXG4gIHJldHVybiB7XHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIC8vIFBXQSAtIGRpc2FibGVkIGZvciBtb2JpbGUgKENhcGFjaXRvcikgYW5kIGZhc3QgZGV2IGJ1aWxkc1xyXG4gICAgICAuLi4oIXNob3VsZERpc2FibGVDb21wcmVzc2lvbiAmJiAhaXNGYXN0RGV2ID8gW1xyXG4gICAgICAgIFZpdGVQV0Eoe1xyXG4gICAgICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXHJcbiAgICAgICAgICBpbmNsdWRlQXNzZXRzOiBbXHJcbiAgICAgICAgICAgICdhc3NldHMvZmF2aWNvbi5pY28nLFxyXG4gICAgICAgICAgICAnYXNzZXRzL2FwcGxlLXRvdWNoLWljb24tcmVtb3ZlYmctcHJldmlldy5wbmcnLFxyXG4gICAgICAgICAgICAnYXNzZXRzL2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nJyxcclxuICAgICAgICAgICAgJ2Fzc2V0cy9hbmRyb2lkLWNocm9tZS01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICAgICAgbmFtZTogJ1VuaVRyYWNrZXIgMjAyNiAtIFN0dWR5ICYgVGFzayBNYW5hZ2VtZW50JyxcclxuICAgICAgICAgICAgc2hvcnRfbmFtZTogJ1VuaVRyYWNrZXInLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZyZWUgc3R1ZHkgYXBwIHdpdGggUG9tb2Rvcm8gdGltZXIsIHRhc2sgbWFuYWdlbWVudCwgYW5kIHByb2dyZXNzIHRyYWNraW5nIGZvciBzdHVkZW50cy4nLFxyXG4gICAgICAgICAgICB0aGVtZV9jb2xvcjogJyMwQTg0RkYnLFxyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzAwMDAwMCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdC1wcmltYXJ5JyxcclxuICAgICAgICAgICAgc2NvcGU6ICcvJyxcclxuICAgICAgICAgICAgc3RhcnRfdXJsOiAnLycsXHJcbiAgICAgICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc3JjOiAnL2Fzc2V0cy9hbmRyb2lkLWNocm9tZS0xOTJ4MTkyLnBuZycsXHJcbiAgICAgICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzcmM6ICcvYXNzZXRzL2FuZHJvaWQtY2hyb21lLTUxMng1MTIucG5nJyxcclxuICAgICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNyYzogJy9hc3NldHMvYW5kcm9pZC1jaHJvbWUtNTEyeDUxMi5wbmcnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICAgICAgcHVycG9zZTogJ21hc2thYmxlJyxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYyfSddLFxyXG4gICAgICAgICAgICAvLyBEb24ndCBjYWNoZSBTdXBhYmFzZSBBUEkgY2FsbHMgb3IgbGFyZ2UgY2h1bmtzXHJcbiAgICAgICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6ICcvaW5kZXguaHRtbCcsXHJcbiAgICAgICAgICAgIG5hdmlnYXRlRmFsbGJhY2tEZW55bGlzdDogW1xyXG4gICAgICAgICAgICAgIC9eXFwvYXBpXFwvLyxcclxuICAgICAgICAgICAgICAvXmh0dHBzOlxcL1xcLy4qXFwuc3VwYWJhc2VcXC5jb1xcLy8sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC8vLFxyXG4gICAgICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtGaXJzdCcsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogJ3N1cGFiYXNlLWFwaScsXHJcbiAgICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcclxuICAgICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwLCAvLyAxIGhvdXJcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcLig/OnBuZ3xqcGd8anBlZ3xzdmd8Z2lmfHdlYnB8aWNvKSQvLFxyXG4gICAgICAgICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdpbWFnZXMnLFxyXG4gICAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogNjAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzAsIC8vIDMwIGRheXNcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwuKD86anN8Y3NzfHdvZmYyPykkLyxcclxuICAgICAgICAgICAgICAgIGhhbmRsZXI6ICdTdGFsZVdoaWxlUmV2YWxpZGF0ZScsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogJ3N0YXRpYy1yZXNvdXJjZXMnLFxyXG4gICAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAwLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDcsIC8vIDcgZGF5c1xyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICBdIDogW10pLFxyXG4gICAgICAvLyBCdW5kbGUgYW5hbHl6ZXIgc29sbyBjdWFuZG8gc2Ugc29saWNpdGEgZXhwbFx1MDBFRGNpdGFtZW50ZVxyXG4gICAgICAuLi4ocHJvY2Vzcy5lbnYuQU5BTFlaRSA9PT0gJ3RydWUnID8gW1xyXG4gICAgICAgIHZpc3VhbGl6ZXIoe1xyXG4gICAgICAgICAgZmlsZW5hbWU6ICdkaXN0L3N0YXRzLmh0bWwnLFxyXG4gICAgICAgICAgb3BlbjogdHJ1ZSxcclxuICAgICAgICAgIGd6aXBTaXplOiB0cnVlLFxyXG4gICAgICAgICAgYnJvdGxpU2l6ZTogdHJ1ZSxcclxuICAgICAgICB9KVxyXG4gICAgICBdIDogW10pLFxyXG4gICAgICAvLyBPbmx5IGVuYWJsZSBjb21wcmVzc2lvbiBmb3Igd2ViIGJ1aWxkcywgbm90IG1vYmlsZSBidWlsZHNcclxuICAgICAgLi4uKCFzaG91bGREaXNhYmxlQ29tcHJlc3Npb24gJiYgIWlzRmFzdERldiA/IFtcclxuICAgICAgICBjb21wcmVzc2lvbih7XHJcbiAgICAgICAgICBhbGdvcml0aG06ICdnemlwJyxcclxuICAgICAgICAgIGV4Y2x1ZGU6IFsvXFwuKGJyKSQvLCAvXFwuKGd6KSQvXSxcclxuICAgICAgICB9KSxcclxuICAgICAgICBjb21wcmVzc2lvbih7XHJcbiAgICAgICAgICBhbGdvcml0aG06ICdicm90bGlDb21wcmVzcycsXHJcbiAgICAgICAgICBleGNsdWRlOiBbL1xcLihicikkLywgL1xcLihneikkL10sXHJcbiAgICAgICAgfSksXHJcbiAgICAgIF0gOiBbXSksXHJcbiAgICBdLFxyXG4gICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgIGluY2x1ZGU6IFtcclxuICAgICAgICAnQGNoYWtyYS11aS9yZWFjdCcsXHJcbiAgICAgICAgJ0BlbW90aW9uL3JlYWN0JyxcclxuICAgICAgICAnQGVtb3Rpb24vc3R5bGVkJyxcclxuICAgICAgICAncmVhY3QnLFxyXG4gICAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAgICdyZWFjdC1kb20vY2xpZW50JyxcclxuICAgICAgICAncmVhY3QtcmVkdXgnLFxyXG4gICAgICAgICdAcmVkdXhqcy90b29sa2l0JyxcclxuICAgICAgICAnZnJhbWVyLW1vdGlvbicsXHJcbiAgICAgICAgJ3JlYWN0LXRvYXN0aWZ5JyxcclxuICAgICAgICAnbHVjaWRlLXJlYWN0JyxcclxuICAgICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcclxuICAgICAgICAnQHN1cGFiYXNlL3Bvc3RncmVzdC1qcycsXHJcbiAgICAgICAgJ0B0aXB0YXAvcmVhY3QnLFxyXG4gICAgICAgICdAdGlwdGFwL3N0YXJ0ZXIta2l0JyxcclxuICAgICAgICAnQHRpcHRhcC9leHRlbnNpb24tcGxhY2Vob2xkZXInLFxyXG4gICAgICAgICdyZWFjdC9qc3gtcnVudGltZScsXHJcbiAgICAgICAgJ3JlYWN0L2pzeC1kZXYtcnVudGltZScsXHJcbiAgICAgICAgJ0BkYXlmbG93L2NvcmUnXHJcbiAgICAgIF0sXHJcbiAgICAgIGV4Y2x1ZGU6IFtcclxuICAgICAgICAnY2hhcnQuanMnXHJcbiAgICAgIF0sXHJcbiAgICAgIC4uLihpc0RldiAmJiAhaXNGYXN0RGV2ICYmIHtcclxuICAgICAgICBlc2J1aWxkT3B0aW9uczoge1xyXG4gICAgICAgICAgdGFyZ2V0OiAnZXMyMDIwJyxcclxuICAgICAgICAgIGRlZmluZToge1xyXG4gICAgICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgdGFyZ2V0OiBbJ2VzMjAyMCcsICdmaXJlZm94OTEnXSxcclxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDAsXHJcbiAgICAgIGNvbW1vbmpzT3B0aW9uczoge1xyXG4gICAgICAgIHRyYW5zZm9ybU1peGVkRXNNb2R1bGVzOiB0cnVlLFxyXG4gICAgICAgIGluY2x1ZGU6IFsvbm9kZV9tb2R1bGVzL10sXHJcbiAgICAgIH0sXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIEVuc3VyZSBSZWFjdCwgUmVhY3QgRE9NLCBhbmQgSlNYIHJ1bnRpbWVzIGxpdmUgdG9nZXRoZXIgZm9yIHN0YWJsZSBleHBvcnRzXHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcclxuICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICBpZC5pbmNsdWRlcygncmVhY3QvanN4LXJ1bnRpbWUnKSB8fFxyXG4gICAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ3JlYWN0L2pzeC1kZXYtcnVudGltZScpIHx8XHJcbiAgICAgICAgICAgICAgICBpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHxcclxuICAgICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdzY2hlZHVsZXInKSB8fFxyXG4gICAgICAgICAgICAgICAgLy8gbWF0Y2ggJy9yZWFjdC8nIGJ1dCBhdm9pZCBtYXRjaGluZyB1bnJlbGF0ZWQgcGFja2FnZXMgd2l0aCAncmVhY3QnIGluIHBhdGggc2VnbWVudHNcclxuICAgICAgICAgICAgICAgIC9bXFxcXC9dbm9kZV9tb2R1bGVzW1xcXFwvXShyZWFjdClbXFxcXC9dLy50ZXN0KGlkKVxyXG4gICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgc291cmNlbWFwOiB0cnVlLFxyXG4gICAgICBjc3NNaW5pZnk6IHRydWUsXHJcbiAgICAgIG1pbmlmeTogJ3RlcnNlcicsXHJcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcclxuICAgICAgbW9kdWxlUHJlbG9hZDoge1xyXG4gICAgICAgIHBvbHlmaWxsOiBmYWxzZVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcclxuICAgICAgfSxcclxuICAgICAgZGVkdXBlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnLCAnQHN1cGFiYXNlL3Bvc3RncmVzdC1qcyddLFxyXG4gICAgICBleHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJywgJy50cycsICcuanN4JywgJy50c3gnLCAnLmpzb24nXVxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiAnMC4wLjAuMCcsXHJcbiAgICAgIHBvcnQ6IDUxNzMsXHJcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICAgIGFsbG93ZWRIb3N0czogWycubmdyb2stZnJlZS5hcHAnXSxcclxuICAgICAgd2F0Y2g6IHtcclxuICAgICAgICB1c2VQb2xsaW5nOiBmYWxzZSxcclxuICAgICAgICBpbnRlcnZhbDogNTAsXHJcbiAgICAgICAgaWdub3JlZDogWycqKi9ub2RlX21vZHVsZXMvKionLCAnKiovZGlzdC8qKiddXHJcbiAgICAgIH0sXHJcbiAgICAgIGhtcjoge1xyXG4gICAgICAgIHBvcnQ6IDUxNzMsXHJcbiAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXHJcbiAgICAgICAgb3ZlcmxheTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICAgIGZzOiB7XHJcbiAgICAgICAgc3RyaWN0OiBmYWxzZSxcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHByZXZpZXc6IHtcclxuICAgICAgcG9ydDogMzAwMCxcclxuICAgICAgaG9zdDogdHJ1ZVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9QLFNBQVMsbUJBQW1CO0FBQ2hSLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsa0JBQWtCO0FBTDNCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsU0FBUyxLQUFLLE1BQU07QUFFakQsUUFBTSwyQkFBMkIsUUFBUSxJQUFJLHdCQUF3QixVQUNyQyxRQUFRLElBQUksc0JBQ1osUUFBUSxLQUFLLEtBQUssU0FBTyxJQUFJLFNBQVMsS0FBSyxDQUFDO0FBRTVFLFFBQU0sUUFBUSxZQUFZO0FBQzFCLFFBQU0sWUFBWSxRQUFRLElBQUksYUFBYTtBQUUzQyxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUE7QUFBQSxNQUVOLEdBQUksQ0FBQyw0QkFBNEIsQ0FBQyxZQUFZO0FBQUEsUUFDNUMsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBLFVBQ2QsZUFBZTtBQUFBLFlBQ2I7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxVQUFVO0FBQUEsWUFDUixNQUFNO0FBQUEsWUFDTixZQUFZO0FBQUEsWUFDWixhQUFhO0FBQUEsWUFDYixhQUFhO0FBQUEsWUFDYixrQkFBa0I7QUFBQSxZQUNsQixTQUFTO0FBQUEsWUFDVCxhQUFhO0FBQUEsWUFDYixPQUFPO0FBQUEsWUFDUCxXQUFXO0FBQUEsWUFDWCxPQUFPO0FBQUEsY0FDTDtBQUFBLGdCQUNFLEtBQUs7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
