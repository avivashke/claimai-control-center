/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_LOCAL_API?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_CLOUDFLARE_WORKER_URL?: string;
  readonly VITE_WORKER_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
