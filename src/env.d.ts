/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string
  readonly VITE_OPENROUTER_MODEL?: string
  readonly VITE_ADMIN_EMAIL?: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
 