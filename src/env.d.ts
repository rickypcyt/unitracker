/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string
  readonly VITE_OPENROUTER_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
 