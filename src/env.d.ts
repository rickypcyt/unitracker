/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string
  readonly VITE_ADMIN_EMAIL?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_PUBLIC_POSTHOG_PROJECT_TOKEN?: string
  readonly VITE_PUBLIC_POSTHOG_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
 